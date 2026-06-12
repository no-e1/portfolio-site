import { NavLink } from "react-router-dom";

const navItems = [
    { to: "/", label: "home", end: true},
    { to: "/about", label: "about me"},
    { to: "/projects", label: "projects"},
    { to: "/docs", label: "docs"},
];

export default function Header() {
  return (
    <header>
      <nav>
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