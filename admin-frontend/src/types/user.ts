export type ManagedUser = {
  id: number;
  username: string;
  isActive: boolean;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UserEditorValue = {
  username?: string;
  password?: string;
};
