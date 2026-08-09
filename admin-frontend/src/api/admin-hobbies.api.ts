import type {
  AdminHobbyContent,
  AdminHobbySection,
  SaveAdminHobbySection,
} from "../types/hobby";
import { adminApiBlobRequest, adminApiRequest } from "./api-client";

const ADMIN_HOBBIES_PATH = "/admin/hobbies";

function createSectionFormData(section: SaveAdminHobbySection): FormData {
  const formData = new FormData();
  formData.set("title", section.title.trim());
  formData.set("description", section.description.trim());
  formData.set(
    "tags",
    JSON.stringify(section.tags.map((tag) => tag.trim()).filter(Boolean)),
  );

  if (section.image) {
    formData.set("image", section.image);
  }

  return formData;
}

export function getAdminHobbies(
  signal?: AbortSignal,
): Promise<AdminHobbyContent> {
  return adminApiRequest<AdminHobbyContent>(ADMIN_HOBBIES_PATH, { signal });
}

export function saveAdminHobbyPage(
  introduction: string,
): Promise<AdminHobbyContent> {
  return adminApiRequest<AdminHobbyContent>(ADMIN_HOBBIES_PATH, {
    method: "PUT",
    json: { introduction: introduction.trim() },
  });
}

export function createAdminHobbySection(
  section: SaveAdminHobbySection,
): Promise<AdminHobbySection> {
  return adminApiRequest<AdminHobbySection>(
    `${ADMIN_HOBBIES_PATH}/sections`,
    {
      method: "POST",
      body: createSectionFormData(section),
    },
  );
}

export function updateAdminHobbySection(
  id: number,
  section: SaveAdminHobbySection,
): Promise<AdminHobbySection> {
  return adminApiRequest<AdminHobbySection>(
    `${ADMIN_HOBBIES_PATH}/sections/${id}`,
    {
      method: "PUT",
      body: createSectionFormData(section),
    },
  );
}

export function reorderAdminHobbySections(
  sectionIds: number[],
): Promise<AdminHobbyContent> {
  return adminApiRequest<AdminHobbyContent>(
    `${ADMIN_HOBBIES_PATH}/sections/order`,
    {
      method: "PUT",
      json: { sectionIds },
    },
  );
}

export function getAdminHobbyImage(
  id: number,
  signal?: AbortSignal,
): Promise<Blob> {
  return adminApiBlobRequest(`${ADMIN_HOBBIES_PATH}/sections/${id}/image`, {
    headers: { Accept: "image/*" },
    signal,
  });
}

export function deleteAdminHobbySection(id: number): Promise<void> {
  return adminApiRequest<void>(`${ADMIN_HOBBIES_PATH}/sections/${id}`, {
    method: "DELETE",
  });
}
