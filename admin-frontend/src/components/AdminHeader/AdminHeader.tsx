import { NavLink } from "react-router-dom";
import styles from "./AdminHeader.module.css";

type AdminHeaderProps = {
  onLogout: () => void;
};

export function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      <nav className={styles.navigation} aria-label="Admin-Navigation">
        <NavLink
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
          to="/"
          end
        >
          dashboard
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
          to="/users"
        >
          users
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.active : ""}`
          }
          to="/projects"
        >
          projects
        </NavLink>
      </nav>
      <button className={styles.logout} type="button" onClick={onLogout}>
        logout
      </button>
    </header>
  );
}
