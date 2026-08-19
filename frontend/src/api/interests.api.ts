import { apiRequest } from "./api-client";

export type Interest = {
  title: string;
  description: string;
};

export function getInterests(signal?: AbortSignal): Promise<Interest[]> {
  return apiRequest<Interest[]>("/interests", { signal });
}
