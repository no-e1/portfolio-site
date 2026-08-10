import { ContactIcons } from "../ContactIcons/ContactIcons";
import { FeaturedProjects } from "./FeaturedProjects";
import styles from "./GreetingsCard.module.css";

export function GreetingsCard() {
    return (
        <article className={styles.home}>
            <h2 className={styles.subheader}>Lernender Informatiker Applikationsentwicklung EFZ</h2>
            <p className={styles.description}>
                Willkommen auf meinem Portfolio. Hier findet man eine Übersicht über meine Projekte sowie
                weitere Informationen über mich und meine Zeugnisse und Unterlagen.
            </p>
            <ContactIcons showLabels />
            <FeaturedProjects />
        </article>
    );
}
