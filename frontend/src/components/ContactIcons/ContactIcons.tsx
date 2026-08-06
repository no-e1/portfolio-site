import { FaEnvelope, FaGithub } from "react-icons/fa";
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
                {showLabels && <span>mein GitHub</span>}
            </a>

            <a href="mailto:noelkohn@proton.me">
                <FaEnvelope aria-hidden="true" />
                {showLabels && <span>Kontakt</span>}
            </a>
        </div>
    );
}
