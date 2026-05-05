import { THEMES, applyTheme, getSavedTheme } from '../utils/theme.js';
import { useState } from 'react';

const COLOR_FAMILIES = ['green', 'orange', 'yellow', 'purple', 'pink', 'blue'];

export default function ThemeSwitcher() {
  const [current, setCurrent] = useState(getSavedTheme());
  const [color, mode] = current.split('-');

  const apply = (newId) => {
    applyTheme(newId);
    setCurrent(newId);
  };

  return (
    <div className="theme-switcher">
      <div className="swatch-row">
        {COLOR_FAMILIES.map(c => {
          const themeObj = THEMES.find(t => t.id === `${c}-dark`);
          return (
            <button
              key={c}
              title={themeObj.label}
              className={`swatch ${color === c ? 'active' : ''}`}
              style={{ '--swatch-bg': themeObj.accent }}
              onClick={() => apply(`${c}-${mode}`)}
              aria-label={`${themeObj.label} color`}
            />
          );
        })}
      </div>
    </div>
  );
}
