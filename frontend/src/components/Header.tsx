import { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getAccessToken,
  subscribeToAuthSession,
} from "../auth/auth-session";

const navItems = [
  { to: "/", label: "home", end: true, requiresAuth: false },
  { to: "/projects", label: "projekte", requiresAuth: false },
  { to: "/about", label: "über mich", requiresAuth: true },
  { to: "/hobbys", label: "hobbys", requiresAuth: true },
  { to: "/docs", label: "dokumente", requiresAuth: true },
];

export default function Header() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => subscribeToAuthSession(() => {
    setIsAuthenticated(getAccessToken() !== null);
  }), []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  function handleLogout() {
    setIsMobileMenuOpen(false);
    clearAuthSession();
    navigate("/");
  }

  function renderNavLinks(isMobile = false) {
    return navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        className={({ isActive }) => {
          const baseClassName = isMobile
            ? "nav-link mobile-nav-link"
            : "nav-link";

          return isActive
            ? `${baseClassName} nav-link-active`
            : baseClassName;
        }}
      >
        <span>{item.label}</span>
        {item.requiresAuth && !isAuthenticated && (
          <FaLock className="nav-lock-icon" aria-hidden="true" />
        )}
      </NavLink>
    ));
  }

  return (
    <header
      className={`site-header${isMobileMenuOpen ? " site-header-mobile-open" : ""}`}
    >
      <nav className="desktop-navigation" aria-label="Hauptnavigation">
        {renderNavLinks()}
      </nav>

      {isAuthenticated && (
        <button
          className="logout desktop-logout"
          type="button"
          onClick={handleLogout}
        >
          logout
        </button>
      )}

      <button
        className={`mobile-menu-toggle${isMobileMenuOpen ? " mobile-menu-toggle-open" : ""}`}
        type="button"
        aria-label={isMobileMenuOpen ? "Navigation schließen" : "Navigation öffnen"}
        aria-controls="mobile-navigation"
        aria-expanded={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      {isMobileMenuOpen && (
        <>
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="Navigation schließen"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobile-menu" id="mobile-navigation">
            <nav className="mobile-navigation" aria-label="Mobile Hauptnavigation">
              {renderNavLinks(true)}
            </nav>
            {isAuthenticated && (
              <div className="mobile-menu-footer">
                <button
                  className="logout mobile-logout"
                  type="button"
                  onClick={handleLogout}
                >
                  logout
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
