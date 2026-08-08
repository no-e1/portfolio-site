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

export type AdminAboutTechnology = {
  id?: number;
  name: string;
  context: string;
  description: string;
};

export type AdminAboutContent = {
  id: number | null;
  sections: AdminAboutSection[];
  technologies: AdminAboutTechnology[];
};

export type SaveAdminAboutContent = Omit<AdminAboutContent, "id">;
