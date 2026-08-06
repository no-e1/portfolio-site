import styles from './PrivacyPage.module.css';

export function PrivacyPage() {
    return (
        <section className={styles.page}>
            <header className={styles.pageHeader}>
                <h1 className={styles.title}>Impressum & Datenschutz</h1>
                <p>
                    Rechtliche Angaben zu dieser Website.
                </p>
            </header>

            <div className={styles.content}>
                <section className={styles.contactSection}>
                    <p className={styles.label}>Verantwortlich</p>
                    <address>
                        <strong>Noel Kohn</strong>
                        <a href="mailto:noelkohn@proton.me">
                            noelkohn@proton.me
                        </a>
                    </address>
                    <p className={styles.rightsNotice}>
                        Fragen zur Datenbearbeitung sowie Anliegen zu Auskunft,
                        Berichtigung oder Löschung können an diese E-Mail-Adresse
                        gerichtet werden.
                    </p>
                </section>

                <section className={styles.processingSection}>
                    <h2>Datenbearbeitung</h2>
                    <ol className={styles.processingList}>
                        <li>
                            <div>
                                <h3>Websitezugriff</h3>
                                <p>
                                    Die Website läuft auf einem privaten, selbstgehosteten Server
                                    und wird über Cloudflare Tunnel ausgeliefert.
                                    Cloudflare verarbeitet dafür
                                    IP-Adressen sowie Routing- und technische
                                    Verkehrsdaten.
                                </p>
                            </div>
                        </li>

                        <li>
                            <div>
                                <h3>Login</h3>
                                <p>
                                    Auf dem privaten Homeserver werden Benutzername,
                                    Passwort-Hash und die Anzahl
                                    erfolgreicher Logins gespeichert.
                                </p>
                            </div>
                        </li>

                        <li>
                            <div>
                                <h3>Browsersitzung</h3>
                                <p>
                                    Nach dem Login werden Zugriffstoken und
                                    Ablaufzeit im sessionStorage
                                    gespeichert. Der Token gilt nur bis zu seiner
                                    Ablaufzeit und wird beim Sitzungsende oder
                                    nach erkannter Ablaufzeit entfernt.
                                </p>
                            </div>
                        </li>

                        <li>
                            <div>
                                <h3>Schriftart</h3>
                                <p>
                                    Die Überschriftenschrift wird von Google
                                    Fonts geladen. Google erhält dabei
                                    technische Verbindungsdaten wie die
                                    IP-Adresse.
                                </p>
                            </div>
                        </li>
                    </ol>
                </section>
            </div>
        </section>
    );
}
