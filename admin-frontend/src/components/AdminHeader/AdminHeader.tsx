import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import styles from "./AdminHeader.module.css";

type AdminHeaderProps = {
  onLogout: () => void;
};

const navItems = [
  { to: "/users", label: "users" },
  { to: "/projects", label: "projects" },
  { to: "/about", label: "about me" },
  { to: "/hobbies", label: "hobbies" },
  { to: "/documents", label: "documents" },
];

export function AdminHeader({ onLogout }: AdminHeaderProps) {
  const location = useLocation();
  const desktopNavigationRef = useRef<HTMLElement>(null);
  const desktopIndicatorRef = useRef<HTMLSpanElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        '[aria-current="page"]',
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
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const desktopMediaQuery = window.matchMedia("(min-width: 701px)");

    function closeMenu() {
      setIsMobileMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    function handleViewportChange(event: MediaQueryListEvent) {
      if (event.matches) {
        closeMenu();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    desktopMediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      desktopMediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, [isMobileMenuOpen]);

  function handleLogout() {
    setIsMobileMenuOpen(false);
    onLogout();
  }

  function renderNavLinks(isMobile = false) {
    return navItems.map((item) => (
      <NavLink
        className={({ isActive }) =>
          [
            styles.navLink,
            isMobile ? styles.mobileNavLink : "",
            isActive ? styles.active : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
        key={item.to}
        onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        to={item.to}
      >
        {item.label}
      </NavLink>
    ));
  }

  return (
    <header
      className={`${styles.header}${isMobileMenuOpen ? ` ${styles.menuOpen}` : ""}`}
    >
      <nav
        className={styles.desktopNavigation}
        aria-label="Admin-Navigation"
        ref={desktopNavigationRef}
      >
        <span
          className={styles.desktopIndicator}
          aria-hidden="true"
          ref={desktopIndicatorRef}
        />
        {renderNavLinks()}
      </nav>

      <button className={styles.desktopLogout} type="button" onClick={handleLogout}>
        logout
      </button>

      <Link
        className={styles.mobileBrand}
        to="/users"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        noelkohn.ch
      </Link>

      <button
        className={`${styles.menuToggle}${isMobileMenuOpen ? ` ${styles.menuToggleOpen}` : ""}`}
        type="button"
        aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
        aria-controls="admin-mobile-navigation"
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
            className={styles.menuBackdrop}
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className={styles.mobileMenu} id="admin-mobile-navigation">
            <nav
              className={styles.mobileNavigation}
              aria-label="Mobile admin navigation"
            >
              {renderNavLinks(true)}
            </nav>
            <div className={styles.mobileMenuFooter}>
              <button
                className={styles.mobileLogout}
                type="button"
                onClick={handleLogout}
              >
                logout
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
