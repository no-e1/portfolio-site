import { AdminLoginForm } from "../../components/Auth/AdminLoginForm";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./LoginPage.module.css";

type LoginPageProps = {
  onLogin: (accessToken: string) => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const requestedPath = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;

  function handleLogin(accessToken: string) {
    onLogin(accessToken);
    navigate(requestedPath ?? "/", { replace: true });
  }

  return (
    <main className={styles.page}>
      <AdminLoginForm onLogin={handleLogin} />
    </main>
  );
}
