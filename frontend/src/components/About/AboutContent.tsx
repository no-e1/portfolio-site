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

export function AboutContent({ onUnauthorized }: AboutContentProps) {
  const [content, setContent] = useState<AboutContentData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      onUnauthorized();
      return;
    }

    const abortController = new AbortController();

    getAbout(accessToken, abortController.signal)
      .then(setContent)
      .catch((error) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          onUnauthorized();
          return;
        }

        setLoadError(true);
      });

    return () => abortController.abort();
  }, [onUnauthorized, requestVersion]);

  if (loadError) {
    return (
      <div className={styles.status}>
        <p role="alert">Der Über-mich-Inhalt konnte nicht geladen werden.</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setContent(null);
            setRequestVersion((version) => version + 1);
          }}
        >
          erneut versuchen
        </button>
      </div>
    );
  }

  if (!content) {
    return <p className={styles.status}>Inhalt wird geladen...</p>;
  }

  const technologyGroups = content.technologyGroups.filter(
    (technologyGroup) => technologyGroup.technologies.length > 0,
  );

  return (
    <article className={styles.content}>
      {content.sections.map((section, sectionIndex) => (
        <section
          className={styles.profile}
          key={`${section.heading}-${sectionIndex}`}
        >
          <p className={styles.sectionLabel}>{section.heading}</p>
          <div>
            <p className={styles.personalText}>{section.body}</p>

            {section.bulletPoints.length > 0 && (
              <dl className={styles.profileFacts}>
                {section.bulletPoints.map((bulletPoint, bulletPointIndex) => (
                  <div
                    key={`${bulletPoint.heading}-${bulletPointIndex}`}
                  >
                    <dt>{bulletPoint.heading}</dt>
                    <dd>{bulletPoint.body}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>
      ))}

      {content.competencies.length > 0 && (
        <section className={styles.profile}>
          <p className={styles.sectionLabel}>Kompetenzen</p>
          <ul className={styles.competencyList}>
            {content.competencies.map((competency, competencyIndex) => (
              <li
                className={styles.competency}
                key={`${competency.title}-${competencyIndex}`}
              >
                <h3 className={styles.competencyTitle}>{competency.title}</h3>
                <p className={styles.competencyDescription}>
                  {competency.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {technologyGroups.length > 0 && (
        <section className={styles.experience}>
          <header className={styles.experienceHeader}>
            <h2>Erfahrungen</h2>
            <p>
              Technologien, mit denen ich bereits Erfahrungen gesammelt habe
            </p>
          </header>

          <div className={styles.technologyGroups}>
            {technologyGroups.map((technologyGroup, technologyGroupIndex) => (
              <section
                className={styles.technologyGroup}
                key={`${technologyGroup.heading}-${technologyGroupIndex}`}
              >
                <h3 className={styles.technologyGroupHeading}>
                  {technologyGroup.heading}
                </h3>
                <ol className={styles.technologyList}>
                  {technologyGroup.technologies.map(
                    (technology, technologyIndex) => (
                      <li
                        className={styles.technology}
                        key={`${technology.name}-${technologyIndex}`}
                      >
                        <div className={styles.technologyHeading}>
                          <h4>{technology.name}</h4>
                          <p>{technology.context}</p>
                        </div>
                        <p className={styles.technologyDescription}>
                          {technology.description}
                        </p>
                      </li>
                    ),
                  )}
                </ol>
              </section>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
