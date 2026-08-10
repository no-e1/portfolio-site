import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaLock } from "react-icons/fa";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  getAccessToken,
  subscribeToAuthSession,
} from "../auth/auth-session";

const navItems = [
  { to: "/", label: "Home", end: true, requiresAuth: false },
  { to: "/projects", label: "Projekte", requiresAuth: false },
  { to: "/about", label: "Über mich", requiresAuth: true },
  { to: "/hobbys", label: "Hobbys", requiresAuth: true },
  { to: "/docs", label: "Dokumente", requiresAuth: true },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const desktopNavigationRef = useRef<HTMLElement>(null);
  const desktopIndicatorRef = useRef<HTMLSpanElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getAccessToken() !== null,
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => subscribeToAuthSession(() => {
    setIsAuthenticated(getAccessToken() !== null);
  }), []);

  useLayoutEffect(() => {
    const navigation = desktopNavigationRef.current;
    const indicator = desktopIndicatorRef.current;

    if (!navigation || !indicator) {
      return;
    }

    const desktopNavigation = navigation;
    const desktopIndicator = indicator;

    function updateIndicator() {
      const activeLink = desktopNavigation.querySelector<HTMLElement>(
        ".nav-link-active",
      );

      if (!activeLink) {
        desktopIndicator.style.opacity = "0";
        return;
      }

      desktopIndicator.style.width = `${activeLink.offsetWidth}px`;
      desktopIndicator.style.height = `${activeLink.offsetHeight}px`;
      desktopIndicator.style.transform = `translate(${activeLink.offsetLeft}px, ${activeLink.offsetTop}px)`;
      desktopIndicator.style.opacity = "1";
    }

    updateIndicator();

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(desktopNavigation);

    return () => resizeObserver.disconnect();
  }, [isAuthenticated, location.pathname]);

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
        {item.requiresAuth && !isAuthenticated && (
          <FaLock className="nav-lock-icon" aria-hidden="true" />
        )}
        <span>{item.label}</span>
      </NavLink>
    ));
  }

  return (
    <header
      className={`site-header${isMobileMenuOpen ? " site-header-mobile-open" : ""}`}
    >
      <nav
        className="desktop-navigation"
        aria-label="Hauptnavigation"
        ref={desktopNavigationRef}
      >
        <span
          className="desktop-nav-indicator"
          aria-hidden="true"
          ref={desktopIndicatorRef}
        />
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

      <Link
        className="mobile-brand"
        to="/"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        noelkohn.ch
      </Link>

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
