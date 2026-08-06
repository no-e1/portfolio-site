import { ContactIcons } from "../ContactIcons/ContactIcons";
import styles from "./GreetingsCard.module.css";
import { Link } from "react-router-dom";

export function GreetingsCard() {
    return (
        <article className={styles.home}>
            <h1 className={styles.mainheader}>Noel Kohn</h1>
            <h2 className={styles.subheader}>Lernender Informatiker Applikationsentwicklung EFZ</h2>
            <ContactIcons showLabels />
            <p className={styles.description}>
                Willkommen auf meinem Portfolio. Hier findet man eine Übersicht über meine Projekte,
                weitere Informationen über mich und meine Unterlagen.
            </p>

            <nav className={styles.pageLinks} aria-label="Portfolio-Inhalte">
                <Link to="/projects">projekte</Link>
                <Link to="/about">über mich</Link>
                <Link to="/docs">dokumente</Link>
            </nav>
        </article>
    );
}
