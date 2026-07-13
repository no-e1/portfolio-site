import { Controller, Get, Query } from '@nestjs/common';
import { ProjectsQueryDto } from './projects-query.dto';
import type { ProjectResponse } from './project-response.type';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(@Query() query: ProjectsQueryDto): Promise<ProjectResponse[]> {
    return this.projectsService.findPublished(query.offset);
  }
}
