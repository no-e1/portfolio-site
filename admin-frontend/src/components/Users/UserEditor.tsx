import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../../api/api-client";
import type { ManagedUser, UserEditorValue } from "../../types/user";
import styles from "./UserEditor.module.css";

export type UserEditorMode = "create" | "username" | "password";

type UserEditorProps = {
  mode: UserEditorMode;
  user: ManagedUser | null;
  onCancel: () => void;
  onSave: (value: UserEditorValue) => Promise<void>;
};

const TITLES: Record<UserEditorMode, string> = {
  create: "Add user",
  username: "Change username",
  password: "Change password",
};

export function UserEditor({
  mode,
  user,
  onCancel,
  onSave,
}: UserEditorProps) {
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onCancel]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        await onSave({ username: username.trim(), password });
      } else if (mode === "username") {
        await onSave({ username: username.trim() });
      } else {
        await onSave({ password });
      }
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "The user could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const showsUsername = mode === "create" || mode === "username";
  const showsPassword = mode === "create" || mode === "password";

  return (
    <div className={styles.backdrop} role="presentation">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-editor-title"
      >
        <div className={styles.header}>
          <div>
            <h2 id="user-editor-title">{TITLES[mode]}</h2>
            {user && <p>{user.username}</p>}
          </div>
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Close user editor"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {showsUsername && (
            <label className={styles.field}>
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete={mode === "create" ? "username" : "off"}
                maxLength={50}
                autoFocus
                disabled={isSubmitting}
                required
              />
            </label>
          )}

          {showsPassword && (
            <label className={styles.field}>
              <span>{mode === "create" ? "Password" : "New password"}</span>
              <div className={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  maxLength={255}
                  autoFocus={mode === "password"}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? "hide" : "show"}
                </button>
              </div>
            </label>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              cancel
            </button>
            <button
              className={styles.saveButton}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "saving..." : mode === "create" ? "add user" : "save"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
