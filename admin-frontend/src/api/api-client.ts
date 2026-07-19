import { clearAdminSession, getAdminAccessToken } from "../auth/admin-session";

const ADMIN_API_BASE_URL = (
  import.meta.env.VITE_ADMIN_API_BASE_URL ?? "/api/v1"
).replace(/\/$/, "");

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
  json?: unknown;
};

type ApiErrorBody = {
  message?: string | string[];
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;

    if (typeof body.message === "string") {
      return body.message;
    }

    if (Array.isArray(body.message)) {
      return body.message.join(" ");
    }
  } catch {
    // The API did not return a JSON error body.
  }

  return `API-Request failed (Status ${response.status}).`;
}

export async function adminApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    body,
    headers,
    json,
    ...requestOptions
  } = options;
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");

  if (authenticated) {
    const accessToken = getAdminAccessToken();

    if (!accessToken) {
      window.dispatchEvent(new Event("admin-session-expired"));
      throw new ApiError("admin-session-expired", 401);
    }

    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  if (json !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body: json === undefined ? body : JSON.stringify(json),
  });

  if (!response.ok) {
    if (authenticated && response.status === 401) {
      clearAdminSession();
      window.dispatchEvent(new Event("admin-session-expired"));
    }

    throw new ApiError(await getErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
