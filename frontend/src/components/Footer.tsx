import { ContactIcons } from "./ContactIcons/ContactIcons";
import contactIconsStyles from "./ContactIcons/ContactIcons.module.css";

export default function Footer() {
    return (
        <footer>
            <p className="footerText">© 2026 <a className="footerTextLink" href="/">xxx.xx</a> | <a id="footerTextLinkPrivacy" className="footerTextLink" href="/privacy">privacy</a></p>

            <ContactIcons className={contactIconsStyles.small} />
        </footer>
    );
}