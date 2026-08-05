import type { AdminAboutContent } from "../types/about";
import { adminApiRequest } from "./api-client";

export function getAdminAbout(
  signal?: AbortSignal,
): Promise<AdminAboutContent> {
  return adminApiRequest<AdminAboutContent>("/admin/about", { signal });
}

export function saveAdminAbout(
  content: AdminAboutContent,
): Promise<AdminAboutContent> {
  return adminApiRequest<AdminAboutContent>("/admin/about", {
    method: "PUT",
    json: content,
  });
}
