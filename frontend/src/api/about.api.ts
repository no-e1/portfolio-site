import { apiRequest } from './api-client';

export type AboutContent = {
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export function getAbout(
  accessToken: string,
): Promise<AboutContent> {
  return apiRequest<AboutContent>('/about', {
    accessToken,
  });
}
