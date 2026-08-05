import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AboutResponse } from '../../about/about-response.type';
import { ABOUT_PAGE_SELECT, toAboutResponse } from '../../about/about.service';
import { SaveAboutDto } from './dto/save-about.dto';

@Injectable()
export class AdminAboutService {
  constructor(private readonly prisma: PrismaService) {}

  async getAbout(): Promise<AboutResponse> {
    const page = await this.prisma.aboutPage.findFirst({
      orderBy: { id: 'asc' },
      select: ABOUT_PAGE_SELECT,
    });

    return page ? toAboutResponse(page) : { intro: '', sections: [] };
  }

  async saveAbout(saveAboutDto: SaveAboutDto): Promise<AboutResponse> {
    const existingPage = await this.prisma.aboutPage.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    const sections = saveAboutDto.sections.map((section, index) => ({
      heading: section.heading,
      body: section.body,
      technologies: section.technologies?.length
        ? section.technologies
        : undefined,
      sortOrder: index,
    }));

    const page = existingPage
      ? await this.prisma.aboutPage.update({
          where: { id: existingPage.id },
          data: {
            intro: saveAboutDto.intro,
            isPublished: true,
            sections: {
              deleteMany: {},
              create: sections,
            },
          },
          select: ABOUT_PAGE_SELECT,
        })
      : await this.prisma.aboutPage.create({
          data: {
            title: 'about',
            intro: saveAboutDto.intro,
            isPublished: true,
            sections: {
              create: sections,
            },
          },
          select: ABOUT_PAGE_SELECT,
        });

    return toAboutResponse(page);
  }
}
