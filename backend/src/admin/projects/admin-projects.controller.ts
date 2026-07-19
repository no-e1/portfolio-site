import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import type { AdminProjectResponse } from './admin-project-response.type';
import { AdminProjectsService } from './admin-projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type {
  ProjectUploadFile,
  ProjectUploadFiles,
} from './project-upload.type';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function projectImageFileFilter(
  _request: Request,
  file: ProjectUploadFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(new BadRequestException('Imagetype not supported'), false);
    return;
  }

  callback(null, true);
}

const ProjectFilesInterceptor = FileFieldsInterceptor(
  [
    { name: 'cover', maxCount: 1 },
    { name: 'media', maxCount: 10 },
  ],
  {
    fileFilter: projectImageFileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 11,
    },
  },
);

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/projects')
export class AdminProjectsController {
  constructor(private readonly adminProjectsService: AdminProjectsService) {}

  @Get()
  findAll(): Promise<AdminProjectResponse[]> {
    return this.adminProjectsService.findAll();
  }

  @Post()
  @UseInterceptors(ProjectFilesInterceptor)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @UploadedFiles() files: ProjectUploadFiles | undefined,
  ): Promise<AdminProjectResponse> {
    return this.adminProjectsService.create(createProjectDto, files);
  }

  @Patch(':id/unpublish')
  unpublish(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ id: number; isPublished: false }> {
    return this.adminProjectsService.unpublish(id);
  }

  @Patch(':id')
  @UseInterceptors(ProjectFilesInterceptor)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
    @UploadedFiles() files: ProjectUploadFiles | undefined,
  ): Promise<AdminProjectResponse> {
    return this.adminProjectsService.update(id, updateProjectDto, files);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ id: number; deleted: true }> {
    return this.adminProjectsService.remove(id);
  }

  @Delete(':id/media/:mediaId')
  removeMedia(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ): Promise<AdminProjectResponse> {
    return this.adminProjectsService.removeMedia(id, mediaId);
  }
}
