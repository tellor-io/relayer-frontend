import React, { createContext, useContext } from 'react';

export const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
