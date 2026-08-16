export type AboutBulletPointResponse = {
  heading: string;
  body: string;
};

export type AboutSectionResponse = {
  heading: string;
  body: string;
  bulletPoints: AboutBulletPointResponse[];
};

export type AboutTechnologyResponse = {
  name: string;
  context: string;
  description: string;
};

export type AboutTechnologyGroupResponse = {
  heading: string;
  technologies: AboutTechnologyResponse[];
};

export type AboutResponse = {
  sections: AboutSectionResponse[];
  technologyGroups: AboutTechnologyGroupResponse[];
};
