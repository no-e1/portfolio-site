import { apiBlobRequest, apiRequest } from "./api-client";

export type ProtectedDocumentType =
  | "curriculumVitae"
  | "gibbCertificate"
  | "bwdCertificate"
  | "secondarySchoolCertificate"
  | "uekCompetenceRecord";

export type ProtectedDocument = {
  id: number;
  type: ProtectedDocumentType;
  title: string;
  originalName: string;
  size: number;
  viewPath: string;
  downloadPath: string;
};

export function getDocuments(
  accessToken: string,
  signal?: AbortSignal,
): Promise<ProtectedDocument[]> {
  return apiRequest<ProtectedDocument[]>("/docs", {
    accessToken,
    signal,
  });
}

export function getDocumentForViewing(
  document: ProtectedDocument,
  accessToken: string,
): Promise<Blob> {
  return apiBlobRequest(document.viewPath, {
    accessToken,
    headers: { Accept: "application/pdf" },
  });
}

export function downloadDocument(
  document: ProtectedDocument,
  accessToken: string,
): Promise<Blob> {
  return apiBlobRequest(document.downloadPath, {
    accessToken,
    headers: { Accept: "application/pdf" },
  });
}

export function downloadAllDocuments(accessToken: string): Promise<Blob> {
  return apiBlobRequest("/docs/download-all.zip", {
    accessToken,
    headers: { Accept: "application/zip" },
  });
}
