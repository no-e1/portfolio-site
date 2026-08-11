import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ZipArchive } from 'archiver';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ArchiveRateLimit,
  MediaReadRateLimit,
  ProtectedReadRateLimit,
} from '../rate-limit/rate-limit.decorators';
import {
  DocsService,
  type DocumentResponse,
  type StoredDocumentFile,
} from './docs.service';

function createContentDisposition(
  disposition: 'inline' | 'attachment',
  fileName: string,
): string {
  const fallbackName = fileName
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_');

  return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function setPdfHeaders(
  response: Response,
  document: StoredDocumentFile,
  disposition: 'inline' | 'attachment',
): void {
  response.set({
    'Content-Type': 'application/pdf',
    'Content-Length': document.size.toString(),
    'Content-Disposition': createContentDisposition(
      disposition,
      document.originalName,
    ),
  });
}

@UseGuards(JwtAuthGuard)
@ProtectedReadRateLimit()
@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get()
  findAll(): Promise<DocumentResponse[]> {
    return this.docsService.findAll();
  }

  @Get('download-all.zip')
  @ArchiveRateLimit()
  async downloadAll(@Res() response: Response): Promise<void> {
    const documents = await this.docsService.getArchiveDocuments();
    const archive = new ZipArchive({ store: true });

    response.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': createContentDisposition(
        'attachment',
        'documents-noel-kohn.zip',
      ),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });

    archive.on('error', (error) => response.destroy(error));
    archive.on('warning', (error) => response.destroy(error));
    archive.pipe(response);

    for (const document of documents) {
      archive.file(document.fullPath, { name: document.archiveName });
    }

    await archive.finalize();
  }

  @Get(':id/view.pdf')
  @MediaReadRateLimit()
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async viewPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const document = await this.docsService.getFile(id);
    setPdfHeaders(response, document, 'inline');

    return new StreamableFile(document.stream);
  }

  @Get(':id/download.pdf')
  @MediaReadRateLimit()
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const document = await this.docsService.getFile(id);
    setPdfHeaders(response, document, 'attachment');

    return new StreamableFile(document.stream);
  }
}
