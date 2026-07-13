import type { Project } from "../types/project";
import { apiRequest } from "./api-client";

const PROJECTS_PAGE_SIZE = 10;

export type ProjectsPageResult = {
  items: Project[];
  nextOffset: number | null;
};

export async function getProjectsPage(
  offset: number,
  signal?: AbortSignal,
): Promise<ProjectsPageResult> {
  const query = new URLSearchParams({
    offset: String(offset),
  });
  const items = await apiRequest<Project[]>(`/projects?${query}`, { signal });

  return {
    items,
    nextOffset:
      items.length === PROJECTS_PAGE_SIZE
        ? offset + PROJECTS_PAGE_SIZE
        : null,
  };
}
