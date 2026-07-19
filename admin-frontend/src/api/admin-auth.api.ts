import { adminApiRequest } from "./api-client";

export type AdminLoginCredentials = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  accessToken: string;
  expiresIn: number;
};

export function loginAdmin(
  credentials: AdminLoginCredentials,
): Promise<AdminLoginResponse> {
  return adminApiRequest<AdminLoginResponse>("/admin/auth/login", {
    authenticated: false,
    method: "POST",
    json: credentials,
  });
}
