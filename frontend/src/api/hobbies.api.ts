import { apiBlobRequest, apiRequest } from "./api-client";

export type HobbySection = {
  id: number;
  title: string;
  description: string;
  tags: string[];
  imagePath: string;
};

export type HobbyContent = {
  introduction: string;
  sections: HobbySection[];
};

export function getHobbies(
  accessToken: string,
  signal?: AbortSignal,
): Promise<HobbyContent> {
  return apiRequest<HobbyContent>("/hobbies", {
    accessToken,
    signal,
  });
}

export function getHobbyImage(
  section: HobbySection,
  accessToken: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return apiBlobRequest(section.imagePath, {
    accessToken,
    headers: { Accept: "image/*" },
    signal,
  });
}
