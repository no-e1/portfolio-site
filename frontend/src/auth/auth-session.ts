import type { LoginResponse } from "../api/auth.api";

const AUTH_SESSION_KEY = "portfolio-auth-session";
const AUTH_SESSION_CHANGE_EVENT = "portfolio-auth-session-change";

type StoredAuthSession = {
  accessToken: string;
  expiresAt: number;
};

export function saveAuthSession(loginResponse: LoginResponse): void {
  const session: StoredAuthSession = {
    accessToken: loginResponse.accessToken,
    expiresAt: Date.now() + loginResponse.expiresIn * 1000,
  };

  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

export function getAccessToken(): string | null {
  const storedSession = sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as StoredAuthSession;

    if (
      typeof session.accessToken !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      clearAuthSession();
      return null;
    }

    return session.accessToken;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

export function subscribeToAuthSession(
  listener: () => void,
): () => void {
  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, listener);

  return () => window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, listener);
}
