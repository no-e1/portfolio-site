import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AboutService } from './about.service';
import type { AboutResponse } from './about-response.type';

@UseGuards(JwtAuthGuard)
@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  getAbout(): Promise<AboutResponse> {
    return this.aboutService.getAbout();
  }
}
