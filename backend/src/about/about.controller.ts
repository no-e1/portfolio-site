import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProtectedReadRateLimit } from '../rate-limit/rate-limit.decorators';
import { UserThrottlerGuard } from '../rate-limit/rate-limit.guards';
import { AboutService } from './about.service';
import type { AboutResponse } from './about-response.type';

@UseGuards(JwtAuthGuard, UserThrottlerGuard)
@ProtectedReadRateLimit()
@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  getAbout(): Promise<AboutResponse> {
    return this.aboutService.getAbout();
  }
}
