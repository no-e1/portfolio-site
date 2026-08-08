export type AdminAboutBulletPointResponse = {
  id: number;
  heading: string;
  body: string;
};

export type AdminAboutSectionResponse = {
  id: number;
  heading: string;
  body: string;
  bulletPoints: AdminAboutBulletPointResponse[];
};

export type AdminAboutTechnologyResponse = {
  id: number;
  name: string;
  context: string;
  description: string;
};

export type AdminAboutResponse = {
  id: number | null;
  sections: AdminAboutSectionResponse[];
  technologies: AdminAboutTechnologyResponse[];
};
