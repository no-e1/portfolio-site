import { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
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

  useEffect(() => subscribeToAuthSession(() => {
    setIsAuthenticated(getAccessToken() !== null);
  }), []);

  function handleLogout() {
    clearAuthSession();
    navigate("/");
  }

  return (
    <header className="site-header">
      <nav aria-label="Hauptnavigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? "nav-link nav-link-active" : "nav-link"
            }
          >
            <span>{item.label}</span>
            {item.requiresAuth && !isAuthenticated && (
              <FaLock className="nav-lock-icon" aria-hidden="true" />
            )}
          </NavLink>
        ))}
      </nav>

      {isAuthenticated && (
        <button className="logout" type="button" onClick={handleLogout}>
          logout
        </button>
      )}
    </header>
  );
}
