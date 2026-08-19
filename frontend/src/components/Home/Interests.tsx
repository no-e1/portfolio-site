import { useEffect, useState } from "react";
import { getInterests, type Interest } from "../../api/interests.api";
import styles from "./Interests.module.css";

export function Interests() {
  const [interests, setInterests] = useState<Interest[] | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadInterests() {
      try {
        const nextInterests = await getInterests(abortController.signal);
        setInterests(nextInterests);
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          setInterests([]);
        }
      }
    }

    void loadInterests();
    return () => abortController.abort();
  }, []);

  if (!interests?.length) {
    return null;
  }

  return (
    <section className={styles.interests} aria-labelledby="interests-title">
      <div className={styles.layout}>
        <header className={styles.header}>
          <h2 id="interests-title">Besondere Interessen</h2>
        </header>

        <div className={styles.list}>
          {interests.map((interest, index) => (
            <article className={styles.item} key={`${interest.title}-${index}`}>
              <h3>{interest.title}</h3>
              <p>{interest.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
