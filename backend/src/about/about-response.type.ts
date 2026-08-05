export type AboutSectionResponse = {
  heading: string;
  body: string;
  technologies?: string[];
};

export type AboutResponse = {
  intro: string;
  sections: AboutSectionResponse[];
};
