import { useEffect, useState } from "react";
import { getAdminProjects } from "../../api/admin-projects.api";
import { getAdminUsers } from "../../api/admin-users.api";
import styles from "./DashboardPage.module.css";

type DashboardStats = {
  users: number;
  projects: number;
  logins: number;
};

const numberFormatter = new Intl.NumberFormat("de-CH");

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadStats() {
      setIsLoading(true);
      setLoadError(false);

      try {
        const [users, projects] = await Promise.all([
          getAdminUsers(abortController.signal),
          getAdminProjects(abortController.signal),
        ]);

        setStats({
          users: users.length,
          projects: projects.length,
          logins: users.reduce(
            (totalLogins, user) => totalLogins + user.loginCount,
            0,
          ),
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLoadError(true);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadStats();
    return () => abortController.abort();
  }, [requestVersion]);

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
      </div>

      {isLoading && <p className={styles.status}>Statistics are loading...</p>}

      {loadError && (
        <div className={styles.status}>
          <p role="alert">Statistics could not be loaded.</p>
          <button
            className={styles.retryButton}
            type="button"
            onClick={() => setRequestVersion((version) => version + 1)}
          >
            try again
          </button>
        </div>
      )}

      {!isLoading && !loadError && stats && (
        <dl className={styles.statsGrid}>
          <div className={styles.statCard}>
            <dt>Total users</dt>
            <dd>{numberFormatter.format(stats.users)}</dd>
          </div>
          <div className={styles.statCard}>
            <dt>Total projects</dt>
            <dd>{numberFormatter.format(stats.projects)}</dd>
          </div>
          <div className={styles.statCard}>
            <dt>Total logins</dt>
            <dd>{numberFormatter.format(stats.logins)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
