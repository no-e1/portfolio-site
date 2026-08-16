import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ABOUT_PAGE_SELECT,
  type AboutPageRecord,
} from '../../about/about.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminAboutResponse } from './admin-about-response.type';
import { SaveAboutDto } from './dto/save-about.dto';

function toAdminAboutResponse(page: AboutPageRecord): AdminAboutResponse {
  return {
    id: page.id,
    sections: page.sections.map((section) => ({
      id: section.id,
      heading: section.heading,
      body: section.body,
      bulletPoints: section.bulletPoints.map((bulletPoint) => ({
        id: bulletPoint.id,
        heading: bulletPoint.heading,
        body: bulletPoint.body,
      })),
    })),
    technologyGroups: page.technologyGroups.map((technologyGroup) => ({
      id: technologyGroup.id,
      heading: technologyGroup.heading,
      technologies: technologyGroup.technologies.map((technology) => ({
        id: technology.id,
        name: technology.name,
        context: technology.context,
        description: technology.description,
      })),
    })),
  };
}

function createSections(saveAboutDto: SaveAboutDto) {
  return saveAboutDto.sections.map((section, sectionIndex) => ({
    heading: section.heading,
    body: section.body,
    sortOrder: sectionIndex,
    bulletPoints: {
      create: section.bulletPoints.map((bulletPoint, bulletPointIndex) => ({
        heading: bulletPoint.heading,
        body: bulletPoint.body,
        sortOrder: bulletPointIndex,
      })),
    },
  }));
}

function createTechnologyGroups(saveAboutDto: SaveAboutDto) {
  return saveAboutDto.technologyGroups.map((technologyGroup, groupIndex) => ({
    heading: technologyGroup.heading,
    sortOrder: groupIndex,
    technologies: {
      create: technologyGroup.technologies.map(
        (technology, technologyIndex) => ({
          name: technology.name,
          context: technology.context,
          description: technology.description,
          sortOrder: technologyIndex,
        }),
      ),
    },
  }));
}

function validateTechnologyCount(saveAboutDto: SaveAboutDto): void {
  const technologyCount = saveAboutDto.technologyGroups.reduce(
    (count, group) => count + group.technologies.length,
    0,
  );

  if (technologyCount > 100) {
    throw new BadRequestException(
      'About content cannot contain more than 100 technologies.',
    );
  }
}

@Injectable()
export class AdminAboutService {
  constructor(private readonly prisma: PrismaService) {}

  async getAbout(): Promise<AdminAboutResponse> {
    const page = await this.prisma.aboutPage.findFirst({
      orderBy: { id: 'asc' },
      select: ABOUT_PAGE_SELECT,
    });

    return page
      ? toAdminAboutResponse(page)
      : { id: null, sections: [], technologyGroups: [] };
  }

  async createAbout(saveAboutDto: SaveAboutDto): Promise<AdminAboutResponse> {
    validateTechnologyCount(saveAboutDto);

    const existingPage = await this.prisma.aboutPage.findFirst({
      select: { id: true },
    });

    if (existingPage) {
      throw new ConflictException('About content already exists.');
    }

    const page = await this.prisma.aboutPage.create({
      data: {
        title: 'about',
        isPublished: true,
        sections: { create: createSections(saveAboutDto) },
        technologyGroups: { create: createTechnologyGroups(saveAboutDto) },
      },
      select: ABOUT_PAGE_SELECT,
    });

    return toAdminAboutResponse(page);
  }

  async updateAbout(saveAboutDto: SaveAboutDto): Promise<AdminAboutResponse> {
    validateTechnologyCount(saveAboutDto);

    const existingPage = await this.prisma.aboutPage.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    if (!existingPage) {
      throw new NotFoundException('About content was not found.');
    }

    const page = await this.prisma.aboutPage.update({
      where: { id: existingPage.id },
      data: {
        isPublished: true,
        sections: {
          deleteMany: {},
          create: createSections(saveAboutDto),
        },
        technologyGroups: {
          deleteMany: {},
          create: createTechnologyGroups(saveAboutDto),
        },
      },
      select: ABOUT_PAGE_SELECT,
    });

    return toAdminAboutResponse(page);
  }

  async deleteAbout(): Promise<void> {
    const page = await this.prisma.aboutPage.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    if (!page) {
      throw new NotFoundException('About content was not found.');
    }

    await this.prisma.aboutPage.delete({ where: { id: page.id } });
  }

  async deleteSection(sectionId: number): Promise<void> {
    const section = await this.prisma.aboutSection.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });

    if (!section) {
      throw new NotFoundException('About section was not found.');
    }

    await this.prisma.aboutSection.delete({ where: { id: section.id } });
  }

  async deleteBulletPoint(
    sectionId: number,
    bulletPointId: number,
  ): Promise<void> {
    const bulletPoint = await this.prisma.aboutBulletPoint.findFirst({
      where: {
        id: bulletPointId,
        aboutSectionId: sectionId,
      },
      select: { id: true },
    });

    if (!bulletPoint) {
      throw new NotFoundException('About bullet point was not found.');
    }

    await this.prisma.aboutBulletPoint.delete({
      where: { id: bulletPoint.id },
    });
  }

  async deleteTechnology(technologyId: number): Promise<void> {
    const technology = await this.prisma.aboutTechnology.findUnique({
      where: { id: technologyId },
      select: { id: true },
    });

    if (!technology) {
      throw new NotFoundException('About technology was not found.');
    }

    await this.prisma.aboutTechnology.delete({
      where: { id: technology.id },
    });
  }

  async deleteTechnologyGroup(technologyGroupId: number): Promise<void> {
    const technologyGroup = await this.prisma.aboutTechnologyGroup.findUnique({
      where: { id: technologyGroupId },
      select: { id: true },
    });

    if (!technologyGroup) {
      throw new NotFoundException('About technology group was not found.');
    }

    await this.prisma.aboutTechnologyGroup.delete({
      where: { id: technologyGroup.id },
    });
  }
}
