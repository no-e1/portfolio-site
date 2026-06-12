import { FaGithub } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa";

export default function Footer() {
    return (
        <footer>
            <p className="footerText">© 2026 <a className="footerTextLink" href="/">xxx.xx</a> | <a id="footerTextLinkPrivacy" className="footerTextLink" href="/privacy">privacy</a></p>
            
            <div className="footerIcons">
                <a href="https://github.com/no-e1" target="_blank">
                    <FaGithub />
                </a>

                <a href="mailto:noelkohn@proton.me">
                    <FaEnvelope />
                </a>
            </div>
        </footer>
    );
}