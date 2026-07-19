import { Link } from "react-router-dom";
import styles from "./AdminHeader.module.css";

type AdminHeaderProps = {
  onLogout: () => void;
};

export function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} to="/">
        admin
      </Link>
      <button className={styles.logout} type="button" onClick={onLogout}>
        logout
      </button>
    </header>
  );
}
