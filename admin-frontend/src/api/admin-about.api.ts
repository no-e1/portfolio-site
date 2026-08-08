import type {
  AdminAboutContent,
  SaveAdminAboutContent,
} from "../types/about";
import { adminApiRequest } from "./api-client";

export function getAdminAbout(
  signal?: AbortSignal,
): Promise<AdminAboutContent> {
  return adminApiRequest<AdminAboutContent>("/admin/about", { signal });
}

export function createAdminAbout(
  content: SaveAdminAboutContent,
): Promise<AdminAboutContent> {
  return adminApiRequest<AdminAboutContent>("/admin/about", {
    method: "POST",
    json: content,
  });
}

export function updateAdminAbout(
  content: SaveAdminAboutContent,
): Promise<AdminAboutContent> {
  return adminApiRequest<AdminAboutContent>("/admin/about", {
    method: "PUT",
    json: content,
  });
}

export function deleteAdminAbout(): Promise<void> {
  return adminApiRequest<void>("/admin/about", { method: "DELETE" });
}

export function deleteAdminAboutSection(sectionId: number): Promise<void> {
  return adminApiRequest<void>(`/admin/about/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function deleteAdminAboutBulletPoint(
  sectionId: number,
  bulletPointId: number,
): Promise<void> {
  return adminApiRequest<void>(
    `/admin/about/sections/${sectionId}/bullet-points/${bulletPointId}`,
    { method: "DELETE" },
  );
}

export function deleteAdminAboutTechnology(
  technologyId: number,
): Promise<void> {
  return adminApiRequest<void>(`/admin/about/technologies/${technologyId}`, {
    method: "DELETE",
  });
}
