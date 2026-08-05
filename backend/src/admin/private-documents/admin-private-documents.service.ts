import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrivateDocumentType, type PrivateDocument } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createReadStream, type ReadStream } from 'fs';
import { lstat, mkdir, rename, unlink, writeFile } from 'fs/promises';
import { basename, isAbsolute, resolve, sep } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

const PDF_SIGNATURE = Buffer.from('%PDF-');
const STORED_PDF_FILE_NAME = /^[0-9a-f-]{36}\.pdf$/;
const DOCUMENT_TYPE_ORDER: Record<PrivateDocumentType, number> = {
  [PrivateDocumentType.gibbCertificate]: 0,
  [PrivateDocumentType.bwdCertificate]: 1,
  [PrivateDocumentType.secondarySchoolCertificate]: 2,
  [PrivateDocumentType.uekCompetenceRecord]: 3,
};

export type UploadedPrivateDocumentFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export type AdminPrivateDocumentResponse = {
  id: number;
  type: PrivateDocumentType;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type PrivateDocumentFile = AdminPrivateDocumentResponse & {
  stream: ReadStream;
};

@Injectable()
export class AdminPrivateDocumentsService {
  private readonly logger = new Logger(AdminPrivateDocumentsService.name);
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

  async findAll(): Promise<AdminPrivateDocumentResponse[]> {
    const documents = await this.prisma.privateDocument.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return this.sortDocuments(documents).map((document) =>
      this.toResponse(document),
    );
  }

  async uploadPdf(
    type: PrivateDocumentType,
    title: string,
    document: UploadedPrivateDocumentFile | undefined,
  ): Promise<AdminPrivateDocumentResponse> {
    if (!document) {
      throw new BadRequestException('PDF document is required.');
    }

    if (
      !document.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)
    ) {
      throw new BadRequestException('file is not a valid PDF');
    }

    const isSingleDocumentType =
      type !== PrivateDocumentType.uekCompetenceRecord;

    if (isSingleDocumentType) {
      const existingDocument = await this.prisma.privateDocument.findFirst({
        where: { type },
        select: { id: true },
      });

      if (existingDocument) {
        throw new ConflictException(
          'A private document of this type already exists.',
        );
      }
    }

    await mkdir(this.storageDirectory, { recursive: true });

    const storageName = `${randomUUID()}.pdf`;
    const fullPath = this.resolveStoredPath(storageName);

    await writeFile(fullPath, document.buffer, { flag: 'wx' });

    try {
      const createdDocument = await this.prisma.privateDocument.create({
        data: {
          type,
          title,
          storageName,
          originalName: this.normalizeOriginalName(document.originalname),
          mimeType: 'application/pdf',
          size: document.size,
        },
      });

      return this.toResponse(createdDocument);
    } catch (error) {
      await this.removeFailedUpload(fullPath);
      throw error;
    }
  }

  async getFile(id: number): Promise<PrivateDocumentFile> {
    const document = await this.findById(id);
    const fullPath = this.resolveStoredPath(document.storageName);
    const stats = await this.getValidFileStats(fullPath);

    if (stats.size !== document.size) {
      this.logger.warn(
        `Stored private document ${document.id} has an unexpected file size.`,
      );
    }

    return {
      ...this.toResponse(document),
      size: stats.size,
      stream: createReadStream(fullPath),
    };
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    const document = await this.findById(id);
    const fullPath = this.resolveStoredPath(document.storageName);
    await this.getValidFileStats(fullPath);

    const deletionPath = resolve(
      this.storageDirectory,
      `.${document.storageName}.${randomUUID()}.deleting`,
    );

    await rename(fullPath, deletionPath);

    try {
      await this.prisma.privateDocument.delete({ where: { id } });
    } catch (error) {
      try {
        await rename(deletionPath, fullPath);
      } catch (restoreError) {
        this.logger.error(
          `Could not restore private document ${id} after a database error.`,
          restoreError instanceof Error ? restoreError.stack : undefined,
        );
      }

      throw error;
    }

    try {
      await unlink(deletionPath);
    } catch (error) {
      this.logger.error(
        `Metadata for private document ${id} was deleted, but its temporary file could not be removed.`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Document metadata was deleted, but file cleanup failed.',
      );
    }

    return { id, deleted: true };
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

  private async getValidFileStats(fullPath: string) {
    try {
      const stats = await lstat(fullPath);

      if (!stats.isFile() || stats.isSymbolicLink()) {
        throw new NotFoundException('Private document file not found.');
      }

      return stats;
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

  private normalizeOriginalName(originalName: string): string {
    const normalizedName = basename(originalName).trim().slice(0, 255);

    return normalizedName || 'document.pdf';
  }

  private async removeFailedUpload(fullPath: string): Promise<void> {
    try {
      await unlink(fullPath);
    } catch (error) {
      this.logger.error(
        'Could not remove a private PDF after its metadata could not be saved.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private sortDocuments(documents: PrivateDocument[]): PrivateDocument[] {
    return [...documents].sort(
      (first, second) =>
        DOCUMENT_TYPE_ORDER[first.type] - DOCUMENT_TYPE_ORDER[second.type] ||
        first.createdAt.getTime() - second.createdAt.getTime() ||
        first.id - second.id,
    );
  }

  private toResponse(document: PrivateDocument): AdminPrivateDocumentResponse {
    return {
      id: document.id,
      type: document.type,
      title: document.title,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
    };
  }
}
