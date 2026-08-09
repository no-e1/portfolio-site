export type AdminHobbySectionResponse = {
  id: number;
  title: string;
  description: string;
  tags: string[];
  imagePath: string;
  imageOriginalName: string;
  imageMimeType: string;
  imageSize: number;
};

export type AdminHobbyResponse = {
  id: number | null;
  introduction: string;
  sections: AdminHobbySectionResponse[];
};
