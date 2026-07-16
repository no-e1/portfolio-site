import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectMediaType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { resolve, sep } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProjectResponse } from '../../projects/project-response.type';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type {
  ProjectUploadFile,
  ProjectUploadFiles,
} from './project-upload.type';

const PROJECT_UPLOAD_DIRECTORY = resolve(process.cwd(), 'uploads', 'projects');
const PROJECT_UPLOAD_PREFIX = '/uploads/projects/';

const FILE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

type StoredProjectFile = {
  fullPath: string;
  src: string;
  type: ProjectMediaType;
};

const PROJECT_RESPONSE_SELECT = {
  id: true,
  title: true,
  shortDescription: true,
  longDescription: true,
  period: true,
  coverType: true,
  coverSrc: true,
  tags: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { label: true },
  },
  media: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { type: true, src: true },
  },
  links: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { type: true, label: true, href: true },
  },
} satisfies Prisma.ProjectSelect;

type ProjectResponseRecord = Prisma.ProjectGetPayload<{
  select: typeof PROJECT_RESPONSE_SELECT;
}>;

@Injectable()
export class AdminProjectsService {
  private readonly logger = new Logger(AdminProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createProjectDto: CreateProjectDto,
    files: ProjectUploadFiles | undefined,
  ): Promise<ProjectResponse> {
    const coverFile = files?.cover?.[0];

    if (!coverFile) {
      throw new BadRequestException('Ein Cover-Bild ist erforderlich.');
    }

    const uploadedFiles = [coverFile, ...(files?.media ?? [])];
    const storedFiles: StoredProjectFile[] = [];

    try {
      await mkdir(PROJECT_UPLOAD_DIRECTORY, { recursive: true });

      for (const uploadedFile of uploadedFiles) {
        storedFiles.push(await this.storeFile(uploadedFile));
      }

      const [storedCover, ...storedMedia] = storedFiles;

      const project = await this.prisma.project.create({
        data: {
          slug: createProjectDto.slug,
          title: createProjectDto.title,
          shortDescription: createProjectDto.shortDescription,
          longDescription: createProjectDto.longDescription,
          period: createProjectDto.period,
          coverType: storedCover.type,
          coverSrc: storedCover.src,
          sortOrder: createProjectDto.sortOrder ?? 0,
          isPublished: createProjectDto.isPublished ?? false,
          tags: createProjectDto.tags?.length
            ? {
                create: createProjectDto.tags.map((label, index) => ({
                  label,
                  sortOrder: index,
                })),
              }
            : undefined,
          media: {
            create: [storedCover, ...storedMedia].map((media, index) => ({
              type: media.type,
              src: media.src,
              sortOrder: index,
            })),
          },
          links: createProjectDto.links?.length
            ? {
                create: createProjectDto.links.map((link, index) => ({
                  type: link.type,
                  label: link.label,
                  href: link.href,
                  sortOrder: index,
                })),
              }
            : undefined,
        },
        select: PROJECT_RESPONSE_SELECT,
      });

      return this.toProjectResponse(project);
    } catch (error) {
      await this.removeFiles(storedFiles.map((file) => file.fullPath));

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Der Projekt-Slug existiert bereits.');
      }

      throw error;
    }
  }

  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
    files: ProjectUploadFiles | undefined,
  ): Promise<ProjectResponse> {
    this.ensureValidId(id);

    const existingProject = await this.prisma.project.findUnique({
      where: { id },
      select: {
        coverType: true,
        coverSrc: true,
        media: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: { type: true, src: true },
        },
      },
    });

    if (!existingProject) {
      throw new NotFoundException('Projekt nicht gefunden.');
    }

    const coverFile = files?.cover?.[0];
    const mediaFiles = files?.media ?? [];
    const shouldReplaceMedia =
      updateProjectDto.replaceMedia === true || files?.media !== undefined;
    const hasScalarChanges = [
      updateProjectDto.slug,
      updateProjectDto.title,
      updateProjectDto.shortDescription,
      updateProjectDto.longDescription,
      updateProjectDto.period,
      updateProjectDto.sortOrder,
      updateProjectDto.isPublished,
    ].some((value) => value !== undefined);
    const hasChanges =
      hasScalarChanges ||
      updateProjectDto.tags !== undefined ||
      updateProjectDto.links !== undefined ||
      coverFile !== undefined ||
      shouldReplaceMedia;

    if (!hasChanges) {
      throw new BadRequestException(
        'Mindestens eine Projektänderung ist erforderlich.',
      );
    }

    const storedFiles: StoredProjectFile[] = [];

    try {
      if (coverFile || mediaFiles.length > 0) {
        await mkdir(PROJECT_UPLOAD_DIRECTORY, { recursive: true });
      }

      const storedCover = coverFile
        ? await this.storeAndTrackFile(coverFile, storedFiles)
        : undefined;
      const storedMedia: StoredProjectFile[] = [];

      for (const mediaFile of mediaFiles) {
        storedMedia.push(await this.storeAndTrackFile(mediaFile, storedFiles));
      }

      const finalCover = storedCover ?? {
        src: existingProject.coverSrc,
        type: existingProject.coverType,
      };
      const retainedMedia = existingProject.media.filter(
        (media) => media.src !== existingProject.coverSrc,
      );
      const finalAdditionalMedia = shouldReplaceMedia
        ? storedMedia
        : retainedMedia;
      const shouldUpdateMedia = storedCover !== undefined || shouldReplaceMedia;
      const data: Prisma.ProjectUpdateInput = {};

      if (updateProjectDto.slug !== undefined) {
        data.slug = updateProjectDto.slug;
      }
      if (updateProjectDto.title !== undefined) {
        data.title = updateProjectDto.title;
      }
      if (updateProjectDto.shortDescription !== undefined) {
        data.shortDescription = updateProjectDto.shortDescription;
      }
      if (updateProjectDto.longDescription !== undefined) {
        data.longDescription = updateProjectDto.longDescription;
      }
      if (updateProjectDto.period !== undefined) {
        data.period = updateProjectDto.period;
      }
      if (updateProjectDto.sortOrder !== undefined) {
        data.sortOrder = updateProjectDto.sortOrder;
      }
      if (updateProjectDto.isPublished !== undefined) {
        data.isPublished = updateProjectDto.isPublished;
      }
      if (storedCover) {
        data.coverType = storedCover.type;
        data.coverSrc = storedCover.src;
      }
      if (updateProjectDto.tags !== undefined) {
        data.tags = {
          deleteMany: {},
          create: updateProjectDto.tags.map((label, index) => ({
            label,
            sortOrder: index,
          })),
        };
      }
      if (updateProjectDto.links !== undefined) {
        data.links = {
          deleteMany: {},
          create: updateProjectDto.links.map((link, index) => ({
            type: link.type,
            label: link.label,
            href: link.href,
            sortOrder: index,
          })),
        };
      }
      if (shouldUpdateMedia) {
        data.media = {
          deleteMany: {},
          create: [finalCover, ...finalAdditionalMedia].map((media, index) => ({
            type: media.type,
            src: media.src,
            sortOrder: index,
          })),
        };
      }

      const project = await this.prisma.project.update({
        where: { id },
        data,
        select: PROJECT_RESPONSE_SELECT,
      });

      const retainedSources = new Set([
        project.coverSrc,
        ...project.media.map((media) => media.src),
      ]);
      const replacedPaths = new Set([
        existingProject.coverSrc,
        ...existingProject.media.map((media) => media.src),
      ]);
      const stalePaths = [...replacedPaths]
        .filter((source) => !retainedSources.has(source))
        .map((source) => this.resolveStoredSource(source))
        .filter((path): path is string => path !== undefined);

      await this.removeFiles(stalePaths);

      return this.toProjectResponse(project);
    } catch (error) {
      await this.removeFiles(storedFiles.map((file) => file.fullPath));

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Der Projekt-Slug existiert bereits.');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Projekt nicht gefunden.');
      }

      throw error;
    }
  }

  async unpublish(id: number): Promise<{ id: number; isPublished: false }> {
    this.ensureValidId(id);

    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: { isPublished: false },
        select: { id: true },
      });

      return { id: project.id, isPublished: false };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Projekt nicht gefunden.');
      }

      throw error;
    }
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    this.ensureValidId(id);

    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        coverSrc: true,
        media: {
          select: { src: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projekt nicht gefunden.');
    }

    try {
      await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Projekt nicht gefunden.');
      }

      throw error;
    }

    const storedSources = new Set([
      project.coverSrc,
      ...project.media.map((media) => media.src),
    ]);
    const storedPaths = [...storedSources]
      .map((source) => this.resolveStoredSource(source))
      .filter((path): path is string => path !== undefined);

    await this.removeFiles(storedPaths);

    return { id, deleted: true };
  }

  private ensureValidId(id: number): void {
    if (id < 1) {
      throw new NotFoundException('Projekt nicht gefunden.');
    }
  }

  private async storeAndTrackFile(
    uploadedFile: ProjectUploadFile,
    storedFiles: StoredProjectFile[],
  ): Promise<StoredProjectFile> {
    const storedFile = await this.storeFile(uploadedFile);
    storedFiles.push(storedFile);

    return storedFile;
  }

  private toProjectResponse(project: ProjectResponseRecord): ProjectResponse {
    return {
      id: project.id,
      title: project.title,
      shortDescription: project.shortDescription,
      longDescription: project.longDescription,
      period: project.period,
      tags: project.tags.map((tag) => tag.label),
      coverMedia: {
        type: project.coverType,
        src: project.coverSrc,
      },
      media: project.media,
      links: project.links,
    };
  }

  private async storeFile(
    uploadedFile: ProjectUploadFile,
  ): Promise<StoredProjectFile> {
    const extension = FILE_EXTENSION_BY_MIME_TYPE[uploadedFile.mimetype];

    if (!extension) {
      throw new BadRequestException('Nicht unterstütztes Bildformat.');
    }

    const fileName = `${randomUUID()}${extension}`;
    const fullPath = resolve(PROJECT_UPLOAD_DIRECTORY, fileName);

    await writeFile(fullPath, uploadedFile.buffer, { flag: 'wx' });

    return {
      fullPath,
      src: `${PROJECT_UPLOAD_PREFIX}${fileName}`,
      type:
        uploadedFile.mimetype === 'image/gif'
          ? ProjectMediaType.gif
          : ProjectMediaType.image,
    };
  }

  private resolveStoredSource(source: string): string | undefined {
    if (!source.startsWith(PROJECT_UPLOAD_PREFIX)) {
      return undefined;
    }

    const fullPath = resolve(process.cwd(), source.slice(1));

    if (!fullPath.startsWith(`${PROJECT_UPLOAD_DIRECTORY}${sep}`)) {
      return undefined;
    }

    return fullPath;
  }

  private async removeFiles(paths: string[]): Promise<void> {
    const results = await Promise.allSettled(paths.map((path) => unlink(path)));

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason as NodeJS.ErrnoException;

        if (error.code !== 'ENOENT') {
          this.logger.warn(
            `Datei konnte nicht gelöscht werden: ${paths[index]}`,
          );
        }
      }
    });
  }
}
