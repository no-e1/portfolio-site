import { FaEnvelope, FaGithub } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import styles from "./ContactIcons.module.css";

type ContactIconsProps = {
    className?: string;
    showLabels?: boolean;
};

export function ContactIcons({ className, showLabels = false }: ContactIconsProps) {
    const containerClassName = [
        styles.ContactIcons,
        showLabels ? styles.labeled : "",
        className ?? "",
    ].filter(Boolean).join(" ");

    return (
        <div className={containerClassName}>
            <a href="https://github.com/no-e1" target="_blank" rel="noreferrer">
                <FaGithub aria-hidden="true" />
                {showLabels && (
                    <>
                        <span>GitHub</span>
                        <FiExternalLink className={styles.linkIcon} aria-hidden="true" />
                    </>
                )}
            </a>

            <a href="mailto:noelkohn@proton.me">
                <FaEnvelope aria-hidden="true" />
                {showLabels && (
                    <>
                        <span>Kontakt</span>
                        <FiExternalLink className={styles.linkIcon} aria-hidden="true" />
                    </>
                )}
            </a>
        </div>
    );
}
