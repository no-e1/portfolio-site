import { Outlet } from "react-router-dom";
import { AdminHeader } from "../AdminHeader/AdminHeader";
import styles from "./AdminLayout.module.css";

type AdminLayoutProps = {
  onLogout: () => void;
};

export function AdminLayout({ onLogout }: AdminLayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <AdminHeader onLogout={onLogout} />
        <main className={styles.content}>
          <Outlet />
        </main>
        <footer className={styles.footer}>
          <p>© 2026 Noel Kohn</p>
        </footer>
      </div>
    </div>
  );
}
