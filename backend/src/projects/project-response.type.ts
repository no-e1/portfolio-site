export type ProjectMediaResponse = {
  type: 'image' | 'gif';
  src: string;
};

export type ProjectLinkResponse = {
  type: 'website' | 'github' | 'document';
  label: string;
  href: string;
};

export type ProjectResponse = {
  id: number;
  title: string;
  shortDescription: string;
  longDescription: string;
  period: string;
  tags: string[];
  coverMedia: ProjectMediaResponse;
  media: ProjectMediaResponse[];
  links: ProjectLinkResponse[];
};
