import { apiRequest } from './api-client';

export type AboutContent = {
  sections: Array<{
    heading: string;
    body: string;
    bulletPoints: Array<{
      heading: string;
      body: string;
    }>;
  }>;
  competencies: Array<{
    title: string;
    description: string;
  }>;
  technologyGroups: Array<{
    heading: string;
    technologies: Array<{
      name: string;
      context: string;
      description: string;
    }>;
  }>;
};

export function getAbout(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AboutContent> {
  return apiRequest<AboutContent>('/about', {
    accessToken,
    signal,
  });
}
