import { ContactIcons } from "../ContactIcons/ContactIcons";
import { FeaturedProjects } from "./FeaturedProjects";
import styles from "./GreetingsCard.module.css";

export function GreetingsCard() {
    return (
        <article className={styles.home}>
            <h2 className={styles.subheader}>Lernender Informatiker Applikationsentwicklung EFZ</h2>
            <p className={styles.description}>
                Willkommen auf meiner persönlichen Website. Hier findet man eine Übersicht meiner Projekte sowie
                weitere Informationen über mich. Bei Fragen und Anliegen bin ich hier erreichbar:
            </p>
            <ContactIcons showLabels />
            <FeaturedProjects />
        </article>
    );
}
