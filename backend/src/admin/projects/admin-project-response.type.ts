import type { ProjectResponse } from '../../projects/project-response.type';

export type AdminProjectResponse = ProjectResponse & {
  slug: string;
  sortOrder: number;
  isPublished: boolean;
};
