import type {
  ProjectMediaResponse,
  ProjectResponse,
} from '../../projects/project-response.type';

export type AdminProjectMediaResponse = ProjectMediaResponse & {
  id: number;
};

export type AdminProjectResponse = Omit<ProjectResponse, 'media'> & {
  slug: string;
  media: AdminProjectMediaResponse[];
  sortOrder: number;
  isPublished: boolean;
};
