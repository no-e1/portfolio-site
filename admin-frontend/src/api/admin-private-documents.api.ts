import type {
  PrivateDocument,
  PrivateDocumentType,
} from "../types/private-document";
import { adminApiBlobRequest, adminApiRequest } from "./api-client";

const PRIVATE_DOCUMENTS_PATH = "/admin/private-documents";

export function getPrivateDocuments(
  signal?: AbortSignal,
): Promise<PrivateDocument[]> {
  return adminApiRequest<PrivateDocument[]>(PRIVATE_DOCUMENTS_PATH, { signal });
}

export function uploadPrivateDocument(
  type: PrivateDocumentType,
  title: string,
  document: File,
): Promise<PrivateDocument> {
  const formData = new FormData();
  formData.set("type", type);
  formData.set("title", title);
  formData.set("document", document);

  return adminApiRequest<PrivateDocument>(PRIVATE_DOCUMENTS_PATH, {
    method: "POST",
    body: formData,
  });
}

export function getPrivateDocumentFile(id: number): Promise<Blob> {
  return adminApiBlobRequest(`${PRIVATE_DOCUMENTS_PATH}/${id}/file`, {
    headers: { Accept: "application/pdf" },
  });
}

export function deletePrivateDocument(
  id: number,
): Promise<{ id: number; deleted: true }> {
  return adminApiRequest(`${PRIVATE_DOCUMENTS_PATH}/${id}`, {
    method: "DELETE",
  });
}
