import { ContactIcons } from "../ContactIcons/ContactIcons";
import styles from "./GreetingsCard.module.css";

export function GreetingsCard() {
    return (
        <article className={styles.home}>
            <h1 className={styles.mainheader}>Noel Kohn</h1>
            <h2 className={styles.subheader}>Lernender Informatiker Applikationsentwicklung EFZ</h2>
            <ContactIcons showLabels />
        </article>
    );
}
