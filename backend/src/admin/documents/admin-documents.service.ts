import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Dirent } from 'fs';
import { lstat, mkdir, readdir, unlink, writeFile } from 'fs/promises';
import { basename, extname, resolve, sep } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

const DOCUMENT_UPLOAD_DIRECTORY = resolve(
  process.cwd(),
  'uploads',
  'documents',
);
const DOCUMENT_UPLOAD_PREFIX = '/uploads/documents/';
const PDF_SIGNATURE = Buffer.from('%PDF-');
const STORED_PDF_FILE_NAME = /^[a-z0-9][a-z0-9-]{0,190}\.pdf$/;

export type UploadedDocumentFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export type UploadedDocumentResponse = {
  link: string;
};

export type AdminDocumentResponse = UploadedDocumentResponse & {
  fileName: string;
  size: number;
  uploadedAt: Date;
  references: Array<{
    projectId: number;
    projectTitle: string;
  }>;
};

@Injectable()
export class AdminDocumentsService {
  private readonly logger = new Logger(AdminDocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AdminDocumentResponse[]> {
    let entries: Dirent[];

    try {
      entries = await readdir(DOCUMENT_UPLOAD_DIRECTORY, {
        withFileTypes: true,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }

      throw error;
    }

    const documents = await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.isFile() &&
            this.resolveDocumentPath(entry.name) !== undefined,
        )
        .map(async (entry) => {
          const fullPath = this.resolveDocumentPath(entry.name);

          if (!fullPath) {
            throw new BadRequestException('Invalid stored document name.');
          }

          const stats = await lstat(fullPath);

          return {
            fileName: entry.name,
            link: `${DOCUMENT_UPLOAD_PREFIX}${entry.name}`,
            size: stats.size,
            uploadedAt: stats.mtime,
          };
        }),
    );
    const references = documents.length
      ? await this.prisma.projectLink.findMany({
          where: {
            href: {
              in: documents.map((document) => document.link),
            },
          },
          select: {
            href: true,
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        })
      : [];

    return documents
      .map((document) => ({
        ...document,
        references: references
          .filter((reference) => reference.href === document.link)
          .map((reference) => ({
            projectId: reference.project.id,
            projectTitle: reference.project.title,
          })),
      }))
      .sort(
        (first, second) =>
          second.uploadedAt.getTime() - first.uploadedAt.getTime(),
      );
  }

  async uploadPdf(
    document: UploadedDocumentFile | undefined,
  ): Promise<UploadedDocumentResponse> {
    if (!document) {
      throw new BadRequestException('PDF document is required.');
    }

    if (!document.buffer.subarray(0, 1024).includes(PDF_SIGNATURE)) {
      throw new BadRequestException('The uploaded file is not a valid PDF.');
    }

    await mkdir(DOCUMENT_UPLOAD_DIRECTORY, { recursive: true });

    const readableName = this.createReadableName(document.originalname);
    const fileName = `${readableName}-${randomUUID()}.pdf`;
    const fullPath = resolve(DOCUMENT_UPLOAD_DIRECTORY, fileName);

    await writeFile(fullPath, document.buffer, { flag: 'wx' });

    return {
      link: `${DOCUMENT_UPLOAD_PREFIX}${fileName}`,
    };
  }

  async remove(fileName: string): Promise<{ link: string; deleted: true }> {
    const link = `${DOCUMENT_UPLOAD_PREFIX}${fileName}`;
    const referenceCount = await this.prisma.projectLink.count({
      where: { href: link },
    });

    if (referenceCount > 0) {
      throw new ConflictException(
        'Remove this document from all projects before deleting it.',
      );
    }

    await this.removeFile(fileName, false);

    return { link, deleted: true };
  }

  async removeUnreferencedLinks(links: string[]): Promise<void> {
    const uniqueLinks = [...new Set(links)].filter((link) =>
      link.startsWith(DOCUMENT_UPLOAD_PREFIX),
    );

    for (const link of uniqueLinks) {
      try {
        const referenceCount = await this.prisma.projectLink.count({
          where: { href: link },
        });

        if (referenceCount === 0) {
          await this.removeFile(
            link.slice(DOCUMENT_UPLOAD_PREFIX.length),
            true,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Could not remove unreferenced document ${link}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }
  }

  private async removeFile(fileName: string, ignoreMissing: boolean) {
    const fullPath = this.resolveDocumentPath(fileName);

    if (!fullPath) {
      throw new BadRequestException('Invalid document name.');
    }

    try {
      const stats = await lstat(fullPath);

      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new BadRequestException('Invalid document target.');
      }

      await unlink(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        if (ignoreMissing) {
          return;
        }

        throw new NotFoundException('Document not found.');
      }

      throw error;
    }
  }

  private resolveDocumentPath(fileName: string): string | undefined {
    if (
      basename(fileName) !== fileName ||
      fileName.includes('..') ||
      !STORED_PDF_FILE_NAME.test(fileName)
    ) {
      return undefined;
    }

    const fullPath = resolve(DOCUMENT_UPLOAD_DIRECTORY, fileName);

    return fullPath.startsWith(`${DOCUMENT_UPLOAD_DIRECTORY}${sep}`)
      ? fullPath
      : undefined;
  }

  private createReadableName(originalName: string): string {
    const originalBaseName = basename(originalName, extname(originalName));
    const sanitizedName = originalBaseName
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '');

    return sanitizedName || 'document';
  }
}
