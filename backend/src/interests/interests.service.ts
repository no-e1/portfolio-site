import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { InterestResponse } from './interest-response.type';

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(): Promise<InterestResponse[]> {
    const page = await this.prisma.aboutPage.findFirst({
      where: { isPublished: true },
      orderBy: { id: 'asc' },
      select: {
        interests: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    return page?.interests ?? [];
  }
}
