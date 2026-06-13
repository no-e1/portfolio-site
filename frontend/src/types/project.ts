export type ProjectMedia = {
  type: "image" | "video" | "gif";
  src: string;
};

export type ProjectLink = {
  type: "website" | "github" | "document";
  label: string;
  href: string;
};

export type Project = {
  id: number;
  title: string;
  shortDescription: string;
  longDescription: string;
  period: string;
  tags: string[];
  coverMedia: ProjectMedia;
  media: ProjectMedia[];
  links: ProjectLink[];
};
