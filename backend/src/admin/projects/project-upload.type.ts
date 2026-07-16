export type ProjectUploadFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export type ProjectUploadFiles = {
  cover?: ProjectUploadFile[];
  media?: ProjectUploadFile[];
};
