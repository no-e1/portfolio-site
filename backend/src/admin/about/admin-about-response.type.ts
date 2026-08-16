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

export type AdminAboutTechnologyGroupResponse = {
  id: number;
  heading: string;
  technologies: AdminAboutTechnologyResponse[];
};

export type AdminAboutResponse = {
  id: number | null;
  sections: AdminAboutSectionResponse[];
  technologyGroups: AdminAboutTechnologyGroupResponse[];
};
