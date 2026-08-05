import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AboutResponse } from './about-response.type';

export const ABOUT_PAGE_SELECT = {
  intro: true,
  sections: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      heading: true,
      body: true,
      technologies: true,
    },
  },
} satisfies Prisma.AboutPageSelect;

export type AboutPageRecord = Prisma.AboutPageGetPayload<{
  select: typeof ABOUT_PAGE_SELECT;
}>;

export function toAboutResponse(page: AboutPageRecord): AboutResponse {
  return {
    intro: page.intro ?? '',
    sections: page.sections.map((section) => ({
      heading: section.heading,
      body: section.body,
      technologies: toTechnologies(section.technologies),
    })),
  };
}

function toTechnologies(value: Prisma.JsonValue): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const technologies = value.filter(
    (technology): technology is string => typeof technology === 'string',
  );

  return technologies.length > 0 ? technologies : undefined;
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
      throw new NotFoundException('About content is not available.');
    }

    return toAboutResponse(page);
  }
}
