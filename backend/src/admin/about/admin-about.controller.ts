import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import type { AboutResponse } from '../../about/about-response.type';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import { AdminAboutService } from './admin-about.service';
import { SaveAboutDto } from './dto/save-about.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/about')
export class AdminAboutController {
  constructor(private readonly adminAboutService: AdminAboutService) {}

  @Get()
  getAbout(): Promise<AboutResponse> {
    return this.adminAboutService.getAbout();
  }

  @Put()
  saveAbout(@Body() saveAboutDto: SaveAboutDto): Promise<AboutResponse> {
    return this.adminAboutService.saveAbout(saveAboutDto);
  }
}
