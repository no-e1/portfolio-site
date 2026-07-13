import { LoginForm } from "../../components/Auth/LoginForm";
import styles from "./AboutPage.module.css";

export function AboutPage() {
  return (
    <section>
      <h1 className={styles.title}>about me</h1>
      <LoginForm />
    </section>
  );
}
