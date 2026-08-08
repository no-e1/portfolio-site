import styles from "./HobbysPage.module.css";
import { useCallback, useState } from "react";
import { getAccessToken } from "../../auth/auth-session";
import { LoginForm } from "../../components/Auth/LoginForm";
import { HobbysContent } from "../../components/Hobbys/HobbysContent";

export function HobbysPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  );
  const handleUnauthorized = useCallback(
    () => setIsAuthenticated(false),
    [],
  );

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Hobbys</h1>
      {isAuthenticated ? (
        <HobbysContent onUnauthorized={handleUnauthorized} />
      ) : (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </section>
  );
}
