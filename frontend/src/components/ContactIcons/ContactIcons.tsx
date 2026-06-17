import { FaEnvelope, FaGithub } from "react-icons/fa";
import styles from "./ContactIcons.module.css";

type ContactIconsProps = {
    className?: string;
};

export function ContactIcons({ className }: ContactIconsProps) {
    return (
        <article className={styles.IconArticle}>
            <div className={`${styles.ContactIcons} ${className ?? ""}`.trim()}>
                <a href="https://github.com/no-e1" target="_blank">
                    <FaGithub />
                </a>

                <a href="mailto:noelkohn@proton.me" id={styles.mailIcon}>
                    <FaEnvelope />
                </a>
            </div>
        </article>
    );
}