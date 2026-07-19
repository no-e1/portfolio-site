import type { AdminLoginResponse } from "../api/admin-auth.api";

const ADMIN_SESSION_KEY = "portfolio-admin-auth-session";

type StoredAdminSession = {
  accessToken: string;
  expiresAt: number;
};

export function saveAdminSession(loginResponse: AdminLoginResponse): void {
  const session: StoredAdminSession = {
    accessToken: loginResponse.accessToken,
    expiresAt: Date.now() + loginResponse.expiresIn * 1000,
  };

  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function getAdminAccessToken(): string | null {
  return getStoredAdminSession()?.accessToken ?? null;
}

export function getAdminSessionExpiresAt(): number | null {
  return getStoredAdminSession()?.expiresAt ?? null;
}

function getStoredAdminSession(): StoredAdminSession | null {
  const storedSession = sessionStorage.getItem(ADMIN_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as StoredAdminSession;

    if (
      typeof session.accessToken !== "string" ||
      session.accessToken.length === 0 ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
