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
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  MediaReadRateLimit,
  ProtectedReadRateLimit,
} from '../rate-limit/rate-limit.decorators';
import { UserThrottlerGuard } from '../rate-limit/rate-limit.guards';
import type { HobbyResponse } from './hobby-response.type';
import { HobbiesService } from './hobbies.service';

@UseGuards(JwtAuthGuard, UserThrottlerGuard)
@ProtectedReadRateLimit()
@Controller('hobbies')
export class HobbiesController {
  constructor(private readonly hobbiesService: HobbiesService) {}

  @Get()
  getHobbies(): Promise<HobbyResponse> {
    return this.hobbiesService.getHobbies();
  }

  @Get(':id/image')
  @MediaReadRateLimit()
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async getImage(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const image = await this.hobbiesService.getImage(id);

    response.set({
      'Content-Type': image.mimeType,
      'Content-Length': image.size.toString(),
      'Content-Disposition': 'inline',
    });

    return new StreamableFile(image.stream);
  }
}
