export type AdminAboutSection = {
  heading: string;
  body: string;
  technologies?: string[];
};

export type AdminAboutContent = {
  intro: string;
  sections: AdminAboutSection[];
};
