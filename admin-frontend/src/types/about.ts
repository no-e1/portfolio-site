export type AdminAboutBulletPoint = {
  id?: number;
  heading: string;
  body: string;
};

export type AdminAboutSection = {
  id?: number;
  heading: string;
  body: string;
  bulletPoints: AdminAboutBulletPoint[];
};

export type AdminAboutCompetency = {
  id?: number;
  title: string;
  description: string;
};

export type AdminAboutTechnology = {
  id?: number;
  name: string;
  context: string;
  description: string;
};

export type AdminAboutTechnologyGroup = {
  id?: number;
  heading: string;
  technologies: AdminAboutTechnology[];
};

export type AdminAboutInterest = {
  id?: number;
  title: string;
  description: string;
};

export type AdminAboutContent = {
  id: number | null;
  sections: AdminAboutSection[];
  competencies: AdminAboutCompetency[];
  technologyGroups: AdminAboutTechnologyGroup[];
  interests: AdminAboutInterest[];
};

export type SaveAdminAboutContent = Omit<AdminAboutContent, "id">;
