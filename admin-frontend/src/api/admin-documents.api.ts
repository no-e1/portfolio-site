import { adminApiRequest } from "./api-client";

export type UploadedDocumentResponse = {
  link: string;
};

export type AdminDocument = UploadedDocumentResponse & {
  fileName: string;
  size: number;
  uploadedAt: string;
  references: Array<{
    projectId: number;
    projectTitle: string;
  }>;
};

export function getAdminDocuments(
  signal?: AbortSignal,
): Promise<AdminDocument[]> {
  return adminApiRequest<AdminDocument[]>("/admin/documents", { signal });
}

export function uploadAdminDocument(
  document: File,
): Promise<UploadedDocumentResponse> {
  const formData = new FormData();
  formData.set("document", document);

  return adminApiRequest<UploadedDocumentResponse>("/admin/documents", {
    method: "POST",
    body: formData,
  });
}

export function deleteAdminDocument(
  fileName: string,
): Promise<{ link: string; deleted: true }> {
  return adminApiRequest(
    `/admin/documents/${encodeURIComponent(fileName)}`,
    { method: "DELETE" },
  );
}
