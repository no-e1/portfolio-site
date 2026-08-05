import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PrivateDocument } from '@prisma/client';
import { createReadStream, type ReadStream } from 'fs';
import { lstat } from 'fs/promises';
import { basename, extname, isAbsolute, resolve, sep } from 'path';
import { PrismaService } from '../prisma/prisma.service';

const STORED_PDF_FILE_NAME = /^[0-9a-f-]{36}\.pdf$/;

export type DocumentResponse = {
  id: number;
  title: string;
  originalName: string;
  size: number;
  createdAt: Date;
  viewPath: string;
  downloadPath: string;
};

export type StoredDocumentFile = {
  id: number;
  originalName: string;
  size: number;
  stream: ReadStream;
};

export type ArchiveDocumentFile = {
  fullPath: string;
  archiveName: string;
};

@Injectable()
export class DocsService {
  private readonly storageDirectory: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    const configuredDirectory = configService.get<string>(
      'PRIVATE_DOCUMENTS_DIR',
    );

    this.storageDirectory = configuredDirectory
      ? isAbsolute(configuredDirectory)
        ? resolve(configuredDirectory)
        : resolve(process.cwd(), configuredDirectory)
      : resolve(process.cwd(), 'private-storage', 'documents');
  }

  async findAll(): Promise<DocumentResponse[]> {
    const documents = await this.prisma.privateDocument.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return documents.map((document) => this.toResponse(document));
  }

  async getFile(id: number): Promise<StoredDocumentFile> {
    const document = await this.findById(id);
    const fullPath = this.resolveStoredPath(document.storageName);
    const size = await this.getFileSize(fullPath);

    return {
      id: document.id,
      originalName: document.originalName,
      size,
      stream: createReadStream(fullPath),
    };
  }

  async getArchiveDocuments(): Promise<ArchiveDocumentFile[]> {
    const documents = await this.prisma.privateDocument.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const usedNames = new Set<string>();

    return Promise.all(
      documents.map(async (document) => {
        const fullPath = this.resolveStoredPath(document.storageName);
        await this.getFileSize(fullPath);

        return {
          fullPath,
          archiveName: this.createUniqueArchiveName(
            document.originalName,
            document.id,
            usedNames,
          ),
        };
      }),
    );
  }

  private async findById(id: number): Promise<PrivateDocument> {
    const document = await this.prisma.privateDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Private document not found.');
    }

    return document;
  }

  private async getFileSize(fullPath: string): Promise<number> {
    try {
      const stats = await lstat(fullPath);

      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new NotFoundException('Private document file not found.');
      }

      return stats.size;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('Private document file not found.');
      }

      throw error;
    }
  }

  private resolveStoredPath(storageName: string): string {
    if (
      basename(storageName) !== storageName ||
      !STORED_PDF_FILE_NAME.test(storageName)
    ) {
      throw new InternalServerErrorException(
        'Invalid private document storage name.',
      );
    }

    const fullPath = resolve(this.storageDirectory, storageName);

    if (!fullPath.startsWith(`${this.storageDirectory}${sep}`)) {
      throw new InternalServerErrorException(
        'Invalid private document storage path.',
      );
    }

    return fullPath;
  }

  private createUniqueArchiveName(
    originalName: string,
    id: number,
    usedNames: Set<string>,
  ): string {
    const safeName = basename(originalName)
      .replace(/[\p{Cc}<>:"/\\|?*]/gu, '_')
      .trim();
    const initialName = safeName || `document-${id}.pdf`;
    const extension = extname(initialName);
    const baseName = basename(initialName, extension);
    let archiveName = initialName;
    let suffix = 2;

    while (usedNames.has(archiveName.toLowerCase())) {
      archiveName = `${baseName} (${suffix})${extension}`;
      suffix += 1;
    }

    usedNames.add(archiveName.toLowerCase());
    return archiveName;
  }

  private toResponse(document: PrivateDocument): DocumentResponse {
    return {
      id: document.id,
      title: document.title,
      originalName: document.originalName,
      size: document.size,
      createdAt: document.createdAt,
      viewPath: `/docs/${document.id}/view.pdf`,
      downloadPath: `/docs/${document.id}/download.pdf`,
    };
  }
}
