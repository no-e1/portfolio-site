import styles from "./HobbysContent.module.css";
import { getAccessToken } from "../../auth/auth-session";
import { useEffect } from "react";

type HobbysContentProps = {
  onUnauthorized: () => void;
};

export function HobbysContent({
  onUnauthorized,
}: HobbysContentProps) {
  useEffect(() => {
    if (!getAccessToken()) {
      onUnauthorized();
    }
  }, [onUnauthorized]);

  return (
    <article className={styles.content}>
      <p>hobbytext</p>
    </article>
  );
}
