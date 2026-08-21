import { Controller, Get } from '@nestjs/common';
import { PublicReadRateLimit } from '../rate-limit/rate-limit.decorators';
import type { InterestResponse } from './interest-response.type';
import { InterestsService } from './interests.service';

@PublicReadRateLimit()
@Controller('interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Get()
  findPublished(): Promise<InterestResponse[]> {
    return this.interestsService.findPublished();
  }
}
