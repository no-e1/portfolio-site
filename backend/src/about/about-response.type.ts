export type AboutBulletPointResponse = {
  heading: string;
  body: string;
};

export type AboutSectionResponse = {
  heading: string;
  body: string;
  bulletPoints: AboutBulletPointResponse[];
};

export type AboutCompetencyResponse = {
  title: string;
  description: string;
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
  competencies: AboutCompetencyResponse[];
  technologyGroups: AboutTechnologyGroupResponse[];
};
