import { useState } from 'react';
import { getAccessToken } from '../../auth/auth-session';
import { LoginForm } from '../../components/Auth/LoginForm';
import { AboutContent } from '../../components/About/AboutContent';
import styles from './AboutPage.module.css';

export function AboutPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  );

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>über mich</h1>
      <p className={styles.introduction}>
        Allgemeine Informationen über mich und meine bisherigen Erfahrungen
      </p>
      {isAuthenticated ? (
        <AboutContent onUnauthorized={() => setIsAuthenticated(false)} />
      ) : (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </section>
  );
}
