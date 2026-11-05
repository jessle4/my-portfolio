import { NavLink, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const isExperiencePage = location.pathname === "/experience";

  const accent = isExperiencePage ? "#365B47" : "#A45573";

  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <NavLink
        to="/"
        className="text-xl font-semibold"
        style={{ color: accent }}
      >
        jessica le ♡
      </NavLink>

      <div className="flex gap-6 text-sm">
        <NavLink
          to="/"
          end
          className="transition-colors"
          style={({ isActive }) => ({
            color: isActive ? accent : "#806D76",
            fontWeight: isActive ? 600 : 400,
          })}
        >
          Home
        </NavLink>

        <NavLink
          to="/experience"
          className="transition-colors"
          style={({ isActive }) => ({
            color: isActive ? accent : "#806D76",
            fontWeight: isActive ? 600 : 400,
          })}
        >
          Experience
        </NavLink>
      </div>
    </nav>
  );
}
