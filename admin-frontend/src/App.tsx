import { useEffect, useState } from "react";
import { AppRoutes } from "./routes/AppRoutes";
import {
  clearAdminSession,
  getAdminAccessToken,
  getAdminSessionExpiresAt,
} from "./auth/admin-session";

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getAdminAccessToken(),
  );

  useEffect(() => {
    function expireSession() {
      clearAdminSession();
      setAccessToken(null);
    }

    window.addEventListener("admin-session-expired", expireSession);

    const expiresAt = getAdminSessionExpiresAt();
    const expiryTimer = expiresAt
      ? window.setTimeout(expireSession, Math.max(0, expiresAt - Date.now()))
      : undefined;

    return () => {
      window.removeEventListener("admin-session-expired", expireSession);

      if (expiryTimer !== undefined) {
        window.clearTimeout(expiryTimer);
      }
    };
  }, [accessToken]);

  function handleLogout() {
    clearAdminSession();
    setAccessToken(null);
  }

  return (
    <AppRoutes
      accessToken={accessToken}
      onLogin={setAccessToken}
      onLogout={handleLogout}
    />
  );
}

export default App;
