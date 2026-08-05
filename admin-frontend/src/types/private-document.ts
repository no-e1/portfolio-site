export const PRIVATE_DOCUMENT_TYPES = [
  "gibbCertificate",
  "bwdCertificate",
  "secondarySchoolCertificate",
  "uekCompetenceRecord",
] as const;

export type PrivateDocumentType = (typeof PRIVATE_DOCUMENT_TYPES)[number];

export const PRIVATE_DOCUMENT_TYPE_LABELS: Record<
  PrivateDocumentType,
  string
> = {
  gibbCertificate: "GIBB-Zeugnis",
  bwdCertificate: "BWD-Zeugnis",
  secondarySchoolCertificate: "Oberstufenzeugnis",
  uekCompetenceRecord: "UEK-Kompetenznachweis",
};

export type PrivateDocument = {
  id: number;
  type: PrivateDocumentType;
  title: string;
  originalName: string;
  mimeType: string;
  size: number;
};
