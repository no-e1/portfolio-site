import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ProjectResponse } from './project-response.type';

const PROJECTS_PAGE_SIZE = 10;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(offset: number): Promise<ProjectResponse[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        isPublished: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      skip: offset,
      take: PROJECTS_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        shortDescription: true,
        longDescription: true,
        period: true,
        coverType: true,
        coverSrc: true,
        tags: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            label: true,
          },
        },
        media: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            type: true,
            src: true,
          },
        },
        links: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            type: true,
            label: true,
            href: true,
          },
        },
      },
    });

    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      shortDescription: project.shortDescription,
      longDescription: project.longDescription,
      period: project.period,
      tags: project.tags.map((tag) => tag.label),
      coverMedia: {
        type: project.coverType,
        src: project.coverSrc,
      },
      media: project.media,
      links: project.links,
    }));
  }
}
