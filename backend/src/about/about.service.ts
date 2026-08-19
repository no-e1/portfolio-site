import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AboutResponse } from './about-response.type';

export const ABOUT_PAGE_SELECT = {
  id: true,
  sections: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      heading: true,
      body: true,
      bulletPoints: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          heading: true,
          body: true,
        },
      },
    },
  },
  technologyGroups: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      heading: true,
      technologies: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          context: true,
          description: true,
        },
      },
    },
  },
  interests: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
    },
  },
} satisfies Prisma.AboutPageSelect;

export type AboutPageRecord = Prisma.AboutPageGetPayload<{
  select: typeof ABOUT_PAGE_SELECT;
}>;

export function toAboutResponse(page: AboutPageRecord): AboutResponse {
  return {
    sections: page.sections.map((section) => ({
      heading: section.heading,
      body: section.body,
      bulletPoints: section.bulletPoints.map((bulletPoint) => ({
        heading: bulletPoint.heading,
        body: bulletPoint.body,
      })),
    })),
    technologyGroups: page.technologyGroups.map((technologyGroup) => ({
      heading: technologyGroup.heading,
      technologies: technologyGroup.technologies.map((technology) => ({
        name: technology.name,
        context: technology.context,
        description: technology.description,
      })),
    })),
  };
}

@Injectable()
export class AboutService {
  constructor(private readonly prisma: PrismaService) {}

  async getAbout(): Promise<AboutResponse> {
    const page = await this.prisma.aboutPage.findFirst({
      where: { isPublished: true },
      orderBy: { id: 'asc' },
      select: ABOUT_PAGE_SELECT,
    });

    if (!page) {
      throw new NotFoundException('Über-mich-Inhalt ist nicht verfügbar.');
    }

    return toAboutResponse(page);
  }
}
