import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createReadStream, type ReadStream } from 'fs';
import { lstat, mkdir, rename, unlink, writeFile } from 'fs/promises';
import { basename, isAbsolute, resolve, sep } from 'path';
import {
  HOBBY_PAGE_SELECT,
  HOBBY_SECTION_SELECT,
  type HobbyPageRecord,
  type HobbySectionRecord,
} from '../../hobbies/hobbies.service';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AdminHobbyResponse,
  AdminHobbySectionResponse,
} from './admin-hobby-response.type';
import type { ReorderHobbiesDto } from './dto/reorder-hobbies.dto';
import type { SaveHobbyPageDto } from './dto/save-hobby-page.dto';
import type { SaveHobbySectionDto } from './dto/save-hobby-section.dto';
import type { HobbyImageUpload } from './hobby-upload.type';

const HOBBY_PAGE_ID = 1;
const STORED_HOBBY_IMAGE_NAME = /^[0-9a-f-]{36}\.(?:gif|jpe?g|png|webp)$/;

type StoredImageFormat = {
  extension: 'gif' | 'jpg' | 'png' | 'webp';
  mimeType: 'image/gif' | 'image/jpeg' | 'image/png' | 'image/webp';
};

type SavedImage = StoredImageFormat & {
  storageName: string;
  originalName: string;
  size: number;
  fullPath: string;
};

export type AdminStoredHobbyImage = {
  mimeType: string;
  size: number;
  stream: ReadStream;
};

function toAdminSectionResponse(
  section: HobbySectionRecord,
): AdminHobbySectionResponse {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    tags: section.tags.map((tag) => tag.label),
    imagePath: `/admin/hobbies/sections/${section.id}/image`,
    imageOriginalName: section.imageOriginalName,
    imageMimeType: section.imageMimeType,
    imageSize: section.imageSize,
  };
}

function toAdminResponse(page: HobbyPageRecord): AdminHobbyResponse {
  return {
    id: page.id,
    introduction: page.introduction,
    sections: page.sections.map(toAdminSectionResponse),
  };
}

@Injectable()
export class AdminHobbiesService {
  private readonly logger = new Logger(AdminHobbiesService.name);
  private readonly storageDirectory: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const configuredDirectory = configService.get<string>(
      'PRIVATE_HOBBY_IMAGES_DIR',
    );

    this.storageDirectory = configuredDirectory
      ? isAbsolute(configuredDirectory)
        ? resolve(configuredDirectory)
        : resolve(process.cwd(), configuredDirectory)
      : resolve(process.cwd(), 'private-storage', 'hobbies');
  }

  async getHobbies(): Promise<AdminHobbyResponse> {
    const page = await this.prisma.hobbyPage.findUnique({
      where: { id: HOBBY_PAGE_ID },
      select: HOBBY_PAGE_SELECT,
    });

    return page
      ? toAdminResponse(page)
      : { id: null, introduction: '', sections: [] };
  }

  async savePage(
    saveHobbyPageDto: SaveHobbyPageDto,
  ): Promise<AdminHobbyResponse> {
    const page = await this.prisma.hobbyPage.upsert({
      where: { id: HOBBY_PAGE_ID },
      create: {
        id: HOBBY_PAGE_ID,
        introduction: saveHobbyPageDto.introduction,
        isPublished: true,
      },
      update: {
        introduction: saveHobbyPageDto.introduction,
        isPublished: true,
      },
      select: HOBBY_PAGE_SELECT,
    });

    return toAdminResponse(page);
  }

  async createSection(
    saveHobbySectionDto: SaveHobbySectionDto,
    image: HobbyImageUpload | undefined,
  ): Promise<AdminHobbySectionResponse> {
    if (!image) {
      throw new BadRequestException('A hobby image is required.');
    }

    await this.requirePage();

    const lastSection = await this.prisma.hobbySection.aggregate({
      where: { hobbyPageId: HOBBY_PAGE_ID },
      _max: { sortOrder: true },
    });
    const savedImage = await this.saveNewImage(image);

    try {
      const section = await this.prisma.hobbySection.create({
        data: {
          hobbyPageId: HOBBY_PAGE_ID,
          title: saveHobbySectionDto.title,
          description: saveHobbySectionDto.description,
          imageStorageName: savedImage.storageName,
          imageOriginalName: savedImage.originalName,
          imageMimeType: savedImage.mimeType,
          imageSize: savedImage.size,
          sortOrder: (lastSection._max.sortOrder ?? -1) + 1,
          tags: {
            create: this.createTags(saveHobbySectionDto.tags),
          },
        },
        select: HOBBY_SECTION_SELECT,
      });

      return toAdminSectionResponse(section);
    } catch (error) {
      await this.removeFailedUpload(savedImage.fullPath);
      throw error;
    }
  }

  async updateSection(
    id: number,
    saveHobbySectionDto: SaveHobbySectionDto,
    image: HobbyImageUpload | undefined,
  ): Promise<AdminHobbySectionResponse> {
    const existingSection = await this.findSectionById(id);
    const tags = this.createTags(saveHobbySectionDto.tags);

    if (!image) {
      const section = await this.prisma.hobbySection.update({
        where: { id },
        data: {
          title: saveHobbySectionDto.title,
          description: saveHobbySectionDto.description,
          tags: {
            deleteMany: {},
            create: tags,
          },
        },
        select: HOBBY_SECTION_SELECT,
      });

      return toAdminSectionResponse(section);
    }

    const savedImage = await this.saveNewImage(image);
    const currentImagePath = this.resolveStoredPath(
      existingSection.imageStorageName,
    );
    await this.getValidFileStats(currentImagePath);
    const deletionPath = this.createDeletionPath(
      existingSection.imageStorageName,
    );

    try {
      await rename(currentImagePath, deletionPath);
    } catch (error) {
      await this.removeFailedUpload(savedImage.fullPath);
      throw error;
    }

    let section: HobbySectionRecord;

    try {
      section = await this.prisma.hobbySection.update({
        where: { id },
        data: {
          title: saveHobbySectionDto.title,
          description: saveHobbySectionDto.description,
          imageStorageName: savedImage.storageName,
          imageOriginalName: savedImage.originalName,
          imageMimeType: savedImage.mimeType,
          imageSize: savedImage.size,
          tags: {
            deleteMany: {},
            create: tags,
          },
        },
        select: HOBBY_SECTION_SELECT,
      });
    } catch (error) {
      await this.restoreReplacedImage(
        deletionPath,
        currentImagePath,
        savedImage.fullPath,
        id,
      );
      throw error;
    }

    await this.removeReplacedImage(deletionPath, id);
    return toAdminSectionResponse(section);
  }

  async reorderSections(
    reorderHobbiesDto: ReorderHobbiesDto,
  ): Promise<AdminHobbyResponse> {
    const currentSections = await this.prisma.hobbySection.findMany({
      where: { hobbyPageId: HOBBY_PAGE_ID },
      select: { id: true },
    });
    const currentIds = new Set(currentSections.map((section) => section.id));

    if (
      currentIds.size !== reorderHobbiesDto.sectionIds.length ||
      reorderHobbiesDto.sectionIds.some((id) => !currentIds.has(id))
    ) {
      throw new BadRequestException(
        'The section order must contain every hobby section exactly once.',
      );
    }

    if (reorderHobbiesDto.sectionIds.length > 0) {
      await this.prisma.$transaction(
        reorderHobbiesDto.sectionIds.map((id, index) =>
          this.prisma.hobbySection.update({
            where: { id },
            data: { sortOrder: index },
          }),
        ),
      );
    }

    const page = await this.requirePage();
    return toAdminResponse(page);
  }

  async getImage(id: number): Promise<AdminStoredHobbyImage> {
    const section = await this.findSectionById(id);
    const fullPath = this.resolveStoredPath(section.imageStorageName);
    const stats = await this.getValidFileStats(fullPath);

    return {
      mimeType: section.imageMimeType,
      size: stats.size,
      stream: createReadStream(fullPath),
    };
  }

  async deleteSection(id: number): Promise<void> {
    const section = await this.findSectionById(id);
    const fullPath = this.resolveStoredPath(section.imageStorageName);
    await this.getValidFileStats(fullPath);
    const deletionPath = this.createDeletionPath(section.imageStorageName);

    await rename(fullPath, deletionPath);

    try {
      await this.prisma.hobbySection.delete({ where: { id } });
    } catch (error) {
      try {
        await rename(deletionPath, fullPath);
      } catch (restoreError) {
        this.logger.error(
          `Could not restore the image for hobby section ${id}.`,
          restoreError instanceof Error ? restoreError.stack : undefined,
        );
      }

      throw error;
    }

    try {
      await unlink(deletionPath);
    } catch (error) {
      this.logger.error(
        `Hobby section ${id} was deleted, but its image cleanup failed.`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Hobby section was deleted, but image cleanup failed.',
      );
    }
  }

  private async requirePage(): Promise<HobbyPageRecord> {
    const page = await this.prisma.hobbyPage.findUnique({
      where: { id: HOBBY_PAGE_ID },
      select: HOBBY_PAGE_SELECT,
    });

    if (!page) {
      throw new NotFoundException(
        'Hobbies page content must be saved before adding sections.',
      );
    }

    return page;
  }

  private async findSectionById(id: number): Promise<HobbySectionRecord> {
    const section = await this.prisma.hobbySection.findFirst({
      where: { id, hobbyPageId: HOBBY_PAGE_ID },
      select: HOBBY_SECTION_SELECT,
    });

    if (!section) {
      throw new NotFoundException('Hobby section was not found.');
    }

    return section;
  }

  private createTags(tags: string[]) {
    const normalizedTags = tags.filter(
      (tag, index) =>
        tags.findIndex(
          (candidate) => candidate.toLowerCase() === tag.toLowerCase(),
        ) === index,
    );

    return normalizedTags.map((label, sortOrder) => ({ label, sortOrder }));
  }

  private async saveNewImage(image: HobbyImageUpload): Promise<SavedImage> {
    const format = this.detectImageFormat(image.buffer);

    if (image.mimetype !== format.mimeType) {
      throw new BadRequestException(
        'The image content does not match its declared file type.',
      );
    }

    await mkdir(this.storageDirectory, { recursive: true });

    const storageName = `${randomUUID()}.${format.extension}`;
    const fullPath = this.resolveStoredPath(storageName);
    await writeFile(fullPath, image.buffer, { flag: 'wx' });

    return {
      ...format,
      storageName,
      originalName: this.normalizeOriginalName(image.originalname),
      size: image.buffer.length,
      fullPath,
    };
  }

  private detectImageFormat(buffer: Buffer): StoredImageFormat {
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return { extension: 'png', mimeType: 'image/png' };
    }

    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return { extension: 'jpg', mimeType: 'image/jpeg' };
    }

    const signature = buffer.subarray(0, 6).toString('ascii');

    if (signature === 'GIF87a' || signature === 'GIF89a') {
      return { extension: 'gif', mimeType: 'image/gif' };
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { extension: 'webp', mimeType: 'image/webp' };
    }

    throw new BadRequestException('The uploaded file is not a valid image.');
  }

  private async getValidFileStats(fullPath: string) {
    try {
      const stats = await lstat(fullPath);

      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new NotFoundException('Hobby image file was not found.');
      }

      return stats;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Hobby image file was not found.');
      }

      throw error;
    }
  }

  private resolveStoredPath(storageName: string): string {
    if (
      basename(storageName) !== storageName ||
      !STORED_HOBBY_IMAGE_NAME.test(storageName)
    ) {
      throw new InternalServerErrorException(
        'Invalid hobby image storage name.',
      );
    }

    const fullPath = resolve(this.storageDirectory, storageName);

    if (!fullPath.startsWith(`${this.storageDirectory}${sep}`)) {
      throw new InternalServerErrorException(
        'Invalid hobby image storage path.',
      );
    }

    return fullPath;
  }

  private createDeletionPath(storageName: string): string {
    const deletionPath = resolve(
      this.storageDirectory,
      `.${storageName}.${randomUUID()}.deleting`,
    );

    if (!deletionPath.startsWith(`${this.storageDirectory}${sep}`)) {
      throw new InternalServerErrorException(
        'Invalid hobby image deletion path.',
      );
    }

    return deletionPath;
  }

  private normalizeOriginalName(originalName: string): string {
    const normalizedName = basename(originalName).trim().slice(0, 255);
    return normalizedName || 'hobby-image';
  }

  private async restoreReplacedImage(
    deletionPath: string,
    currentImagePath: string,
    newImagePath: string,
    sectionId: number,
  ): Promise<void> {
    try {
      await rename(deletionPath, currentImagePath);
    } catch (error) {
      this.logger.error(
        `Could not restore the previous image for hobby section ${sectionId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    await this.removeFailedUpload(newImagePath);
  }

  private async removeReplacedImage(
    deletionPath: string,
    sectionId: number,
  ): Promise<void> {
    try {
      await unlink(deletionPath);
    } catch (error) {
      this.logger.error(
        `The previous image for hobby section ${sectionId} could not be removed.`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Hobby section was updated, but previous image cleanup failed.',
      );
    }
  }

  private async removeFailedUpload(fullPath: string): Promise<void> {
    try {
      await unlink(fullPath);
    } catch (error) {
      this.logger.error(
        'Could not remove a hobby image after its metadata could not be saved.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
