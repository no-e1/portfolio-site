import { LoginForm } from "../../components/Auth/LoginForm"
import styles from "./DocsPage.module.css"

export function DocsPage() {
    return (
        <section>
            <h1 className={styles.title}>Dokumente</h1>
            <LoginForm />
        </section>
    );
}
