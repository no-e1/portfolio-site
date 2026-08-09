import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import type {
  AdminHobbyResponse,
  AdminHobbySectionResponse,
} from './admin-hobby-response.type';
import { AdminHobbiesService } from './admin-hobbies.service';
import { ReorderHobbiesDto } from './dto/reorder-hobbies.dto';
import { SaveHobbyPageDto } from './dto/save-hobby-page.dto';
import { SaveHobbySectionDto } from './dto/save-hobby-section.dto';
import type { HobbyImageUpload } from './hobby-upload.type';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function hobbyImageFileFilter(
  _request: Request,
  file: HobbyImageUpload,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(
      new BadRequestException(
        'Only GIF, JPEG, PNG and WebP images are supported.',
      ),
      false,
    );
    return;
  }

  callback(null, true);
}

const HobbyImageInterceptor = FileInterceptor('image', {
  fileFilter: hobbyImageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/hobbies')
export class AdminHobbiesController {
  constructor(private readonly adminHobbiesService: AdminHobbiesService) {}

  @Get()
  getHobbies(): Promise<AdminHobbyResponse> {
    return this.adminHobbiesService.getHobbies();
  }

  @Put()
  savePage(
    @Body() saveHobbyPageDto: SaveHobbyPageDto,
  ): Promise<AdminHobbyResponse> {
    return this.adminHobbiesService.savePage(saveHobbyPageDto);
  }

  @Post('sections')
  @UseInterceptors(HobbyImageInterceptor)
  createSection(
    @Body() saveHobbySectionDto: SaveHobbySectionDto,
    @UploadedFile() image: HobbyImageUpload | undefined,
  ): Promise<AdminHobbySectionResponse> {
    return this.adminHobbiesService.createSection(saveHobbySectionDto, image);
  }

  @Put('sections/order')
  reorderSections(
    @Body() reorderHobbiesDto: ReorderHobbiesDto,
  ): Promise<AdminHobbyResponse> {
    return this.adminHobbiesService.reorderSections(reorderHobbiesDto);
  }

  @Get('sections/:id/image')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async getImage(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const image = await this.adminHobbiesService.getImage(id);

    response.set({
      'Content-Type': image.mimeType,
      'Content-Length': image.size.toString(),
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(image.stream);
  }

  @Put('sections/:id')
  @UseInterceptors(HobbyImageInterceptor)
  updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() saveHobbySectionDto: SaveHobbySectionDto,
    @UploadedFile() image: HobbyImageUpload | undefined,
  ): Promise<AdminHobbySectionResponse> {
    return this.adminHobbiesService.updateSection(
      id,
      saveHobbySectionDto,
      image,
    );
  }

  @Delete('sections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSection(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminHobbiesService.deleteSection(id);
  }
}
