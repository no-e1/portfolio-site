import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/api-client";
import { login } from "../../api/auth.api";
import { saveAuthSession } from "../../auth/auth-session";
import styles from "./LoginForm.module.css";

type LoginFormProps = {
  onLogin: () => void;
};


export function LoginForm({ onLogin }: LoginFormProps) {
  const [credentialsError, setCredentialsError] = useState(false);
  const [serviceError, setServiceError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = formData.get("username");
    const password = formData.get("password");

    if (typeof username !== "string" || typeof password !== "string") {
      return;
    }

    setCredentialsError(false);
    setServiceError(false);
    setIsSubmitting(true);

    try {
      const loginResponse = await login({
        username: username.trim(),
        password,
      });

      saveAuthSession(loginResponse);
      form.reset();
      onLogin();
    } catch (loginError) {
      if (loginError instanceof ApiError && loginError.status === 401) {
        setCredentialsError(true);
      } else {
        setServiceError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
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
            maxLength={50}
            aria-invalid={credentialsError}
            aria-describedby={credentialsError ? "login-error" : undefined}
            disabled={isSubmitting}
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
            maxLength={255}
            aria-invalid={credentialsError}
            aria-describedby={credentialsError ? "login-error" : undefined}
            disabled={isSubmitting}
            required
          />
        </label>

        {credentialsError && (
          <p id="login-error" className={styles.error} role="alert">
            Benutzername oder Passwort ist falsch.
          </p>
        )}

        {serviceError && (
          <p className={styles.error} role="alert">
            Login ist momentan nicht verfügbar.
          </p>
        )}

        <button
          className={styles.submitButton}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Anmeldung..." : "login"}
        </button>
      </form>
    </section>
  );
}
