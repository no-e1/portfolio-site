export type HobbySectionResponse = {
  id: number;
  title: string;
  description: string;
  tags: string[];
  imagePath: string;
};

export type HobbyResponse = {
  introduction: string;
  sections: HobbySectionResponse[];
};
