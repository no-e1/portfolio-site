import { useCallback, useState } from "react";
import { getAccessToken } from "../../auth/auth-session";
import { LoginForm } from "../../components/Auth/LoginForm";
import { DocumentsContent } from "../../components/Documents/DocumentsContent";
import styles from "./DocsPage.module.css";

export function DocsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  );
  const handleUnauthorized = useCallback(
    () => setIsAuthenticated(false),
    [],
  );

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Dokumente</h1>
      {isAuthenticated && (
        <p className={styles.introduction}>
          Mein Lebenslauf, Zeugnisse und weitere Ausbildungsnachweise als PDF.
        </p>
      )}
      {isAuthenticated ? (
        <DocumentsContent onUnauthorized={handleUnauthorized} />
      ) : (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </section>
  );
}
