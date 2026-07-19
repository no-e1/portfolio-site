export type ProjectMedia = {
  type: "image" | "gif";
  src: string;
};

export type AdminProjectMedia = ProjectMedia & {
  id: number;
};

export type ProjectLinkType = "website" | "github" | "document";

export type ProjectLink = {
  type: ProjectLinkType;
  label: string;
  href: string;
};

export type AdminProject = {
  id: number;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  period: string;
  tags: string[];
  coverMedia: ProjectMedia;
  media: AdminProjectMedia[];
  links: ProjectLink[];
  sortOrder: number;
  isPublished: boolean;
};

export type ProjectEditorValue = {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  period: string;
  tags: string[];
  links: ProjectLink[];
  sortOrder: number;
  coverFile: File | null;
  mediaFiles: File[];
  replaceMedia: boolean;
  removedMediaSources: string[];
};
