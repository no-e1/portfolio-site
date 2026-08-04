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
    <section>
      <h1 className={styles.title}>über mich</h1>
      {isAuthenticated ? (
        <AboutContent
          onUnauthorized={() => setIsAuthenticated(false)}
        />
      ) : (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      )}
    </section>
  );
}
