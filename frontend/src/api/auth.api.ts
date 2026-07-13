import { apiRequest } from "./api-client";

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
};

export function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    json: credentials,
  });
}
