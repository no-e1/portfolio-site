import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import type { AdminAboutResponse } from './admin-about-response.type';
import { AdminAboutService } from './admin-about.service';
import { SaveAboutDto } from './dto/save-about.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/about')
export class AdminAboutController {
  constructor(private readonly adminAboutService: AdminAboutService) {}

  @Get()
  getAbout(): Promise<AdminAboutResponse> {
    return this.adminAboutService.getAbout();
  }

  @Post()
  createAbout(@Body() saveAboutDto: SaveAboutDto): Promise<AdminAboutResponse> {
    return this.adminAboutService.createAbout(saveAboutDto);
  }

  @Put()
  updateAbout(@Body() saveAboutDto: SaveAboutDto): Promise<AdminAboutResponse> {
    return this.adminAboutService.updateAbout(saveAboutDto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAbout(): Promise<void> {
    return this.adminAboutService.deleteAbout();
  }

  @Delete('sections/:sectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
  ): Promise<void> {
    return this.adminAboutService.deleteSection(sectionId);
  }

  @Delete('sections/:sectionId/bullet-points/:bulletPointId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBulletPoint(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Param('bulletPointId', ParseIntPipe) bulletPointId: number,
  ): Promise<void> {
    return this.adminAboutService.deleteBulletPoint(sectionId, bulletPointId);
  }

  @Delete('technologies/:technologyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTechnology(
    @Param('technologyId', ParseIntPipe) technologyId: number,
  ): Promise<void> {
    return this.adminAboutService.deleteTechnology(technologyId);
  }
}
