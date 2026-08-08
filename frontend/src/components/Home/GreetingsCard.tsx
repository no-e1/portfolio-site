import { ContactIcons } from "../ContactIcons/ContactIcons";
import { FeaturedProjects } from "./FeaturedProjects";
import styles from "./GreetingsCard.module.css";

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
            <FeaturedProjects />
        </article>
    );
}
