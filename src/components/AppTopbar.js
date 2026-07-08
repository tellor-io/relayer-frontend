import React from 'react';
import { useThemeMode } from '../context/ThemeModeContext';

export const AppTopbar = () => {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <header className="t-topbar">
      <a className="t-brand" href="/" aria-label="Tellor Feeds">
        <img
          className="t-logo"
          src={isDark ? '/tellor-feeds-logo-dark.png' : '/tellor-feeds-logo-light.png'}
          alt="Tellor Feeds"
        />
      </a>
      <div className="t-spacer" />
      <button
        type="button"
        className="t-iconbtn"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {isDark ? (
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </>
          )}
        </svg>
      </button>
    </header>
  );
};
