import type { ManagedUser, UserEditorValue } from "../types/user";
import { adminApiRequest } from "./api-client";

export function getAdminUsers(signal?: AbortSignal): Promise<ManagedUser[]> {
  return adminApiRequest<ManagedUser[]>("/admin/users", { signal });
}

export function createAdminUser(
  username: string,
  password: string,
): Promise<ManagedUser> {
  return adminApiRequest<ManagedUser>("/admin/users", {
    method: "POST",
    json: { username, password },
  });
}

export function updateAdminUser(
  id: number,
  value: UserEditorValue,
): Promise<ManagedUser> {
  return adminApiRequest<ManagedUser>(`/admin/users/${id}`, {
    method: "PATCH",
    json: value,
  });
}

export function setAdminUserActive(
  id: number,
  isActive: boolean,
): Promise<ManagedUser> {
  return adminApiRequest<ManagedUser>(
    `/admin/users/${id}/${isActive ? "activate" : "deactivate"}`,
    { method: "PATCH" },
  );
}

export function deleteAdminUser(
  id: number,
): Promise<{ id: number; deleted: true }> {
  return adminApiRequest(`/admin/users/${id}`, { method: "DELETE" });
}
