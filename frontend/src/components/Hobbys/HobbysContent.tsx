import { useEffect, useState } from "react";
import { ApiError } from "../../api/api-client";
import {
  getHobbies,
  getHobbyImage,
  type HobbyContent,
} from "../../api/hobbies.api";
import {
  clearAuthSession,
  getAccessToken,
} from "../../auth/auth-session";
import styles from "./HobbysContent.module.css";

type HobbysContentProps = {
  onUnauthorized: () => void;
};

export function HobbysContent({ onUnauthorized }: HobbysContentProps) {
  const [content, setContent] = useState<HobbyContent | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadError, setLoadError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      onUnauthorized();
      return;
    }

    const authenticatedAccessToken = accessToken;
    const abortController = new AbortController();
    const objectUrls: string[] = [];

    async function loadContent() {
      try {
        const hobbyContent = await getHobbies(
          authenticatedAccessToken,
          abortController.signal,
        );
        const images = await Promise.all(
          hobbyContent.sections.map(async (section) => {
            const image = await getHobbyImage(
              section,
              authenticatedAccessToken,
              abortController.signal,
            );
            const imageUrl = URL.createObjectURL(image);
            objectUrls.push(imageUrl);
            return [section.id, imageUrl] as const;
          }),
        );

        if (!abortController.signal.aborted) {
          setImageUrls(Object.fromEntries(images));
          setContent(hobbyContent);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          clearAuthSession();
          onUnauthorized();
          return;
        }

        setLoadError(true);
      }
    }

    void loadContent();

    return () => {
      abortController.abort();
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [onUnauthorized, requestVersion]);

  if (loadError) {
    return (
      <div className={styles.status}>
        <p role="alert">Der Hobby-Inhalt konnte nicht geladen werden.</p>
        <button
          type="button"
          onClick={() => {
            setLoadError(false);
            setContent(null);
            setImageUrls({});
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

  return (
    <article className={styles.content}>
      {content.introduction && (
        <p className={styles.introduction}>{content.introduction}</p>
      )}

      <ol className={styles.hobbyList}>
        {content.sections.map((hobby, index) => (
          <li className={styles.hobby} key={hobby.id}>
            <div className={styles.imageFrame}>
              <img
                src={imageUrls[hobby.id]}
                alt={`Bild zum Hobby ${hobby.title}`}
              />
            </div>

            <div className={styles.details}>
              <p className={styles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2>{hobby.title}</h2>
              <p className={styles.description}>{hobby.description}</p>
              {hobby.tags.length > 0 && (
                <ul
                  className={styles.tags}
                  aria-label={`Themen zu ${hobby.title}`}
                >
                  {hobby.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
