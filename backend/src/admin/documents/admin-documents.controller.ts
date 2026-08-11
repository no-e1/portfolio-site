import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import {
  AdminDeleteRateLimit,
  AdminReadRateLimit,
  AdminUploadRateLimit,
} from '../../rate-limit/rate-limit.decorators';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import {
  AdminDocumentsService,
  type AdminDocumentResponse,
  type UploadedDocumentFile,
  type UploadedDocumentResponse,
} from './admin-documents.service';

const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;

function pdfFileFilter(
  _request: Request,
  file: UploadedDocumentFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (file.mimetype !== 'application/pdf') {
    callback(
      new BadRequestException('Only PDF documents are supported.'),
      false,
    );
    return;
  }

  callback(null, true);
}

const PdfDocumentInterceptor = FileInterceptor('document', {
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_PDF_FILE_SIZE,
    files: 1,
  },
});

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/documents')
export class AdminDocumentsController {
  constructor(private readonly adminDocumentsService: AdminDocumentsService) {}

  @Get()
  @AdminReadRateLimit()
  findAll(): Promise<AdminDocumentResponse[]> {
    return this.adminDocumentsService.findAll();
  }

  @Post()
  @AdminUploadRateLimit()
  @UseInterceptors(PdfDocumentInterceptor)
  upload(
    @UploadedFile() document: UploadedDocumentFile | undefined,
  ): Promise<UploadedDocumentResponse> {
    return this.adminDocumentsService.uploadPdf(document);
  }

  @Delete(':fileName')
  @AdminDeleteRateLimit()
  remove(
    @Param('fileName') fileName: string,
  ): Promise<{ link: string; deleted: true }> {
    return this.adminDocumentsService.remove(fileName);
  }
}
