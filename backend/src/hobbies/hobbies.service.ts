import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { createReadStream, type ReadStream } from 'fs';
import { lstat } from 'fs/promises';
import { basename, isAbsolute, resolve, sep } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import type { HobbyResponse } from './hobby-response.type';

const STORED_HOBBY_IMAGE_NAME = /^[0-9a-f-]{36}\.(?:gif|jpe?g|png|webp)$/;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const HOBBY_SECTION_SELECT = {
  id: true,
  title: true,
  description: true,
  imageStorageName: true,
  imageOriginalName: true,
  imageMimeType: true,
  imageSize: true,
  sortOrder: true,
  tags: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      label: true,
    },
  },
} satisfies Prisma.HobbySectionSelect;

export const HOBBY_PAGE_SELECT = {
  id: true,
  introduction: true,
  sections: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: HOBBY_SECTION_SELECT,
  },
} satisfies Prisma.HobbyPageSelect;

export type HobbyPageRecord = Prisma.HobbyPageGetPayload<{
  select: typeof HOBBY_PAGE_SELECT;
}>;

export type HobbySectionRecord = Prisma.HobbySectionGetPayload<{
  select: typeof HOBBY_SECTION_SELECT;
}>;

export type StoredHobbyImage = {
  mimeType: string;
  size: number;
  stream: ReadStream;
};

export function toHobbyResponse(page: HobbyPageRecord): HobbyResponse {
  return {
    introduction: page.introduction,
    sections: page.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      tags: section.tags.map((tag) => tag.label),
      imagePath: `/hobbies/${section.id}/image`,
    })),
  };
}

@Injectable()
export class HobbiesService {
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

  async getHobbies(): Promise<HobbyResponse> {
    const page = await this.prisma.hobbyPage.findFirst({
      where: { isPublished: true },
      orderBy: { id: 'asc' },
      select: HOBBY_PAGE_SELECT,
    });

    if (!page) {
      throw new NotFoundException('Hobby-Inhalt ist nicht verfügbar.');
    }

    return toHobbyResponse(page);
  }

  async getImage(id: number): Promise<StoredHobbyImage> {
    const section = await this.prisma.hobbySection.findFirst({
      where: {
        id,
        hobbyPage: { isPublished: true },
      },
      select: {
        imageStorageName: true,
        imageMimeType: true,
      },
    });

    if (!section) {
      throw new NotFoundException('Hobby-Bild wurde nicht gefunden.');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(section.imageMimeType)) {
      throw new InternalServerErrorException(
        'Ungültiger Dateityp des Hobby-Bildes.',
      );
    }

    const fullPath = this.resolveStoredPath(section.imageStorageName);
    const size = await this.getFileSize(fullPath);

    return {
      mimeType: section.imageMimeType,
      size,
      stream: createReadStream(fullPath),
    };
  }

  private async getFileSize(fullPath: string): Promise<number> {
    try {
      const stats = await lstat(fullPath);

      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new NotFoundException('Hobby-Bild wurde nicht gefunden.');
      }

      return stats.size;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Hobby-Bild wurde nicht gefunden.');
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
        'Ungültiger Speichername für ein Hobby-Bild.',
      );
    }

    const fullPath = resolve(this.storageDirectory, storageName);

    if (!fullPath.startsWith(`${this.storageDirectory}${sep}`)) {
      throw new InternalServerErrorException(
        'Ungültiger Speicherpfad für ein Hobby-Bild.',
      );
    }

    return fullPath;
  }
}
