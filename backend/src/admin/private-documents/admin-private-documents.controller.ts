import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import {
  AdminPrivateDocumentsService,
  type AdminPrivateDocumentResponse,
  type UploadedPrivateDocumentFile,
} from './admin-private-documents.service';
import { UploadPrivateDocumentDto } from './dto/upload-private-document.dto';

const MAX_PDF_FILE_SIZE = 10 * 1024 * 1024;

function pdfFileFilter(
  _request: Request,
  file: UploadedPrivateDocumentFile,
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

const PrivatePdfInterceptor = FileInterceptor('document', {
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: MAX_PDF_FILE_SIZE,
    files: 1,
  },
});

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/private-documents')
export class AdminPrivateDocumentsController {
  constructor(
    private readonly privateDocumentsService: AdminPrivateDocumentsService,
  ) {}

  @Get()
  findAll(): Promise<AdminPrivateDocumentResponse[]> {
    return this.privateDocumentsService.findAll();
  }

  @Get(':id/file')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async getFile(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const document = await this.privateDocumentsService.getFile(id);
    const encodedName = encodeURIComponent(document.originalName);

    response.set({
      'Content-Type': document.mimeType,
      'Content-Length': document.size.toString(),
      'Content-Disposition': `inline; filename*=UTF-8''${encodedName}`,
    });

    return new StreamableFile(document.stream);
  }

  @Post()
  @UseInterceptors(PrivatePdfInterceptor)
  upload(
    @Body() body: UploadPrivateDocumentDto,
    @UploadedFile() document: UploadedPrivateDocumentFile | undefined,
  ): Promise<AdminPrivateDocumentResponse> {
    return this.privateDocumentsService.uploadPdf(
      body.type,
      body.title,
      document,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ id: number; deleted: true }> {
    return this.privateDocumentsService.remove(id);
  }
}
