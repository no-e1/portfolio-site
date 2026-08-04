import { useEffect, useState } from 'react';
import { ApiError } from '../../api/api-client';
import {
  getAbout,
  type AboutContent as AboutContentData,
} from '../../api/about.api';
import {
  clearAuthSession,
  getAccessToken,
} from '../../auth/auth-session';
import styles from './AboutContent.module.css';

type AboutContentProps = {
  onUnauthorized: () => void;
};

export function AboutContent({
  onUnauthorized,
}: AboutContentProps) {
  const [content, setContent] =
    useState<AboutContentData | null>(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      onUnauthorized();
      return;
    }

    getAbout(token)
      .then(setContent)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          onUnauthorized();
        }
      });
  }, [onUnauthorized]);

  if (!content) {
    return <p>Inhalt wird geladen...</p>;
  }

  return (
    <article>
      <p className={styles.intro}>{content.intro}</p>

      {content.sections.map((section) => (
        <section
          className={styles.section}
          key={section.heading}
        >
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </article>
  );
}
