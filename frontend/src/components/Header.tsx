import { NavLink } from "react-router-dom";

const navItems = [
    { to: "/", label: "home", end: true},
    { to: "/projects", label: "projekte"},
    { to: "/about", label: "über mich"},
    { to: "/hobbys", label: "hobbys"},
    { to: "/docs", label: "dokumente"},
];

export default function Header() {
  return (
    <header>
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
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}