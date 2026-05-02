import { NavLink } from "react-router-dom";

const modes = [
  { to: "/heardle", label: "Guess by Hearing" },
  { to: "/lyrics", label: "Guess by Lyrics" },
];

export default function GameModeBar() {
  return (
    <div className="w-full bg-gray-900 border-b border-gray-800 game-mode-bar">
      <div className="max-w-4xl mx-auto px-4 py-3 flex gap-2">
        {modes.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end
            className={({ isActive }) =>
              `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-700 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`
            }
          >
            {m.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
