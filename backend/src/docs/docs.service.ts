import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrivateDocumentType, type PrivateDocument } from '@prisma/client';
import { createReadStream, type ReadStream } from 'fs';
import { lstat } from 'fs/promises';
import { basename, extname, isAbsolute, resolve, sep } from 'path';
import { PrismaService } from '../prisma/prisma.service';

const STORED_PDF_FILE_NAME = /^[0-9a-f-]{36}\.pdf$/;
const DOCUMENT_TYPE_ORDER: Record<PrivateDocumentType, number> = {
  [PrivateDocumentType.curriculumVitae]: 0,
  [PrivateDocumentType.gibbCertificate]: 1,
  [PrivateDocumentType.bwdCertificate]: 2,
  [PrivateDocumentType.secondarySchoolCertificate]: 3,
  [PrivateDocumentType.uekCompetenceRecord]: 4,
};

export type DocumentResponse = {
  id: number;
  type: PrivateDocumentType;
  title: string;
  originalName: string;
  size: number;
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
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return this.sortDocuments(documents).map((document) =>
      this.toResponse(document),
    );
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
      this.sortDocuments(documents).map(async (document) => {
        const fullPath = this.resolveStoredPath(document.storageName);
        await this.getFileSize(fullPath);

        return {
          fullPath,
          archiveName: this.createUniqueArchiveName(
            document.originalName,
            document.id,
            document.type === PrivateDocumentType.uekCompetenceRecord
              ? 'uek_kompetenznachweise'
              : undefined,
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
      throw new NotFoundException('Privates Dokument wurde nicht gefunden.');
    }

    return document;
  }

  private async getFileSize(fullPath: string): Promise<number> {
    try {
      const stats = await lstat(fullPath);

      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new NotFoundException(
          'Datei des privaten Dokuments wurde nicht gefunden.',
        );
      }

      return stats.size;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException(
          'Datei des privaten Dokuments wurde nicht gefunden.',
        );
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
        'Ungültiger Speichername für ein privates Dokument.',
      );
    }

    const fullPath = resolve(this.storageDirectory, storageName);

    if (!fullPath.startsWith(`${this.storageDirectory}${sep}`)) {
      throw new InternalServerErrorException(
        'Ungültiger Speicherpfad für ein privates Dokument.',
      );
    }

    return fullPath;
  }

  private createUniqueArchiveName(
    originalName: string,
    id: number,
    directory: string | undefined,
    usedNames: Set<string>,
  ): string {
    const safeName = basename(originalName)
      .replace(/[\p{Cc}<>:"/\\|?*]/gu, '_')
      .trim();
    const initialName = safeName || `document-${id}.pdf`;
    const extension = extname(initialName);
    const baseName = basename(initialName, extension);
    let fileName = initialName;
    let archiveName = directory ? `${directory}/${fileName}` : fileName;
    let suffix = 2;

    while (usedNames.has(archiveName.toLowerCase())) {
      fileName = `${baseName} (${suffix})${extension}`;
      archiveName = directory ? `${directory}/${fileName}` : fileName;
      suffix += 1;
    }

    usedNames.add(archiveName.toLowerCase());
    return archiveName;
  }

  private sortDocuments(documents: PrivateDocument[]): PrivateDocument[] {
    return [...documents].sort(
      (first, second) =>
        DOCUMENT_TYPE_ORDER[first.type] - DOCUMENT_TYPE_ORDER[second.type] ||
        first.createdAt.getTime() - second.createdAt.getTime() ||
        first.id - second.id,
    );
  }

  private toResponse(document: PrivateDocument): DocumentResponse {
    return {
      id: document.id,
      type: document.type,
      title: document.title,
      originalName: document.originalName,
      size: document.size,
      viewPath: `/docs/${document.id}/view.pdf`,
      downloadPath: `/docs/${document.id}/download.pdf`,
    };
  }
}
