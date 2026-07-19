import type {
  AdminProject,
  ProjectEditorValue,
} from "../types/project";
import { adminApiRequest } from "./api-client";

function createProjectFormData(
  project: ProjectEditorValue,
  isPublished: boolean,
  includeUpdateOptions: boolean,
): FormData {
  const formData = new FormData();

  formData.set("slug", project.slug.trim());
  formData.set("title", project.title.trim());
  formData.set("shortDescription", project.shortDescription.trim());
  formData.set("longDescription", project.longDescription.trim());
  formData.set("period", project.period.trim());
  formData.set(
    "tags",
    JSON.stringify(project.tags.map((tag) => tag.trim()).filter(Boolean)),
  );
  formData.set(
    "links",
    JSON.stringify(
      project.links.map((link) => ({
        type: link.type,
        label: link.label.trim(),
        href: link.href.trim(),
      })),
    ),
  );
  formData.set("sortOrder", String(project.sortOrder));
  formData.set("isPublished", String(isPublished));

  if (project.coverFile) {
    formData.set("cover", project.coverFile);
  }

  project.mediaFiles.forEach((file) => formData.append("media", file));

  if (includeUpdateOptions && project.replaceMedia) {
    formData.set("replaceMedia", "true");
  }

  return formData;
}

export function getAdminProjects(signal?: AbortSignal): Promise<AdminProject[]> {
  return adminApiRequest<AdminProject[]>("/admin/projects", { signal });
}

export function createAdminProject(
  project: ProjectEditorValue,
  isPublished: boolean,
): Promise<AdminProject> {
  return adminApiRequest<AdminProject>("/admin/projects", {
    method: "POST",
    body: createProjectFormData(project, isPublished, false),
  });
}

export function updateAdminProject(
  id: number,
  project: ProjectEditorValue,
  isPublished: boolean,
): Promise<AdminProject> {
  return adminApiRequest<AdminProject>(`/admin/projects/${id}`, {
    method: "PATCH",
    body: createProjectFormData(project, isPublished, true),
  });
}

export function unpublishAdminProject(
  id: number,
): Promise<{ id: number; isPublished: false }> {
  return adminApiRequest(`/admin/projects/${id}/unpublish`, {
    method: "PATCH",
  });
}

export function publishAdminProject(id: number): Promise<AdminProject> {
  return adminApiRequest<AdminProject>(`/admin/projects/${id}`, {
    method: "PATCH",
    json: { isPublished: true },
  });
}

export function deleteAdminProjectMedia(
  projectId: number,
  mediaId: number,
): Promise<AdminProject> {
  return adminApiRequest<AdminProject>(
    `/admin/projects/${projectId}/media/${mediaId}`,
    { method: "DELETE" },
  );
}

export function deleteAdminProject(
  id: number,
): Promise<{ id: number; deleted: true }> {
  return adminApiRequest(`/admin/projects/${id}`, { method: "DELETE" });
}
