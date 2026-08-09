export type AdminHobbySection = {
  id: number;
  title: string;
  description: string;
  tags: string[];
  imagePath: string;
  imageOriginalName: string;
  imageMimeType: string;
  imageSize: number;
};

export type AdminHobbyContent = {
  id: number | null;
  introduction: string;
  sections: AdminHobbySection[];
};

export type SaveAdminHobbySection = {
  title: string;
  description: string;
  tags: string[];
  image?: File;
};
