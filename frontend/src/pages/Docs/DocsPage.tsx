import { useState } from "react";
import { getAccessToken } from "../../auth/auth-session";
import { LoginForm } from "../../components/Auth/LoginForm";
import styles from "./DocsPage.module.css";

export function DocsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  );

  return (
    <section>
      <h1 className={styles.title}>Dokumente</h1>
      {!isAuthenticated && (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </section>
  );
}
