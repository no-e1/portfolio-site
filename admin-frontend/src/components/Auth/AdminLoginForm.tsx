import { useState, type FormEvent } from "react";
import { loginAdmin } from "../../api/admin-auth.api";
import { ApiError } from "../../api/api-client";
import { saveAdminSession } from "../../auth/admin-session";
import styles from "./AdminLoginForm.module.css";

type AdminLoginFormProps = {
  onLogin: (accessToken: string) => void;
};

export function AdminLoginForm({ onLogin }: AdminLoginFormProps) {
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
      const loginResponse = await loginAdmin({
        username: username.trim(),
        password,
      });

      saveAdminSession(loginResponse);
      form.reset();
      onLogin(loginResponse.accessToken);
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
    <section className={styles.card} aria-labelledby="admin-login-title">
      <div className={styles.intro}>
        <h1 id="admin-login-title" className={styles.title}>
          login
        </h1>
        <p className={styles.description}>
          Anmeldung für Zugriff auf Verwaltungsseite.
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
            aria-describedby={credentialsError ? "admin-login-error" : undefined}
            disabled={isSubmitting}
            autoFocus
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
            aria-describedby={credentialsError ? "admin-login-error" : undefined}
            disabled={isSubmitting}
            required
          />
        </label>

        {credentialsError && (
          <p id="admin-login-error" className={styles.error} role="alert">
            Benutzername oder Passwort falsch.
          </p>
        )}

        {serviceError && (
          <p className={styles.error} role="alert">
            Admin-Login nicht verfügbar.
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
