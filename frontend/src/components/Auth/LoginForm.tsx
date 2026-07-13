import { useState, type FormEvent } from "react";
import styles from "./LoginForm.module.css";

export function LoginForm() {
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("Benutzername oder Passwort ist falsch.");
  }

  return (
    <section className={styles.card} aria-labelledby="login-title">
      <div className={styles.intro}>
        <h2 id="login-title" className={styles.title}>
          login
        </h2>
        <p className={styles.description}>
          Melden Sie sich an, um auf diese Inhalte zuzugreifen.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>username</span>
          <input
            className={styles.input}
            type="text"
            name="username"
            autoComplete="username"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>password</span>
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            required
          />
        </label>

        {error && (
          <p id="login-error" className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.submitButton} type="submit">
          login
        </button>
      </form>
    </section>
  );
}
