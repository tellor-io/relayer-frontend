import { createTheme } from '@mui/material/styles';

export const TELLOR_COLORS = {
  pine50: '#eefffb',
  pine700: '#0f5c58',
  pine800: '#0a4a47',
  pine950: '#003734',
  emerald300: '#4de8a8',
  emerald500: '#08d482',
  emerald700: '#06a864',
  opal100: '#e8f4f2',
  opal200: '#d1e8e5',
  opal600: '#5a7d79',
  opal700: '#4a6966',
  neptune300: '#8fb6b2',
  darkBg: '#001f1d',
  darkSurface2: '#002624',
  darkBorder: '#0a4a47',
  darkBorderSoft: '#073330',
  danger: '#e5484d',
};

export function getChartColors(mode = 'light') {
  const isDark = mode === 'dark';
  return {
    delayPrimary: isDark ? TELLOR_COLORS.emerald300 : TELLOR_COLORS.emerald500,
    delaySecondary: isDark ? TELLOR_COLORS.neptune300 : TELLOR_COLORS.opal600,
    pricePrimary: isDark ? TELLOR_COLORS.emerald300 : TELLOR_COLORS.emerald500,
    priceSecondary: isDark ? TELLOR_COLORS.pine700 : TELLOR_COLORS.pine800,
    grid: isDark ? 'rgba(255,255,255,0.06)' : TELLOR_COLORS.opal100,
    tick: isDark ? TELLOR_COLORS.neptune300 : TELLOR_COLORS.opal700,
    legend: isDark ? TELLOR_COLORS.pine50 : TELLOR_COLORS.pine950,
    tooltipBg: isDark ? TELLOR_COLORS.pine950 : '#ffffff',
    tooltipText: isDark ? TELLOR_COLORS.pine50 : TELLOR_COLORS.pine950,
  };
}

export function createTellorTheme(mode = 'light') {
  const isDark = mode === 'dark';

  const palette = isDark
    ? {
        mode: 'dark',
        primary: { main: TELLOR_COLORS.emerald500, contrastText: TELLOR_COLORS.pine950 },
        secondary: { main: TELLOR_COLORS.emerald300 },
        background: {
          default: TELLOR_COLORS.darkBg,
          paper: TELLOR_COLORS.pine950,
        },
        text: {
          primary: TELLOR_COLORS.pine50,
          secondary: TELLOR_COLORS.neptune300,
        },
        divider: TELLOR_COLORS.darkBorder,
        error: { main: TELLOR_COLORS.danger },
      }
    : {
        mode: 'light',
        primary: { main: TELLOR_COLORS.pine950, contrastText: TELLOR_COLORS.pine50 },
        secondary: { main: TELLOR_COLORS.emerald500 },
        background: {
          default: TELLOR_COLORS.pine50,
          paper: '#ffffff',
        },
        text: {
          primary: TELLOR_COLORS.pine950,
          secondary: TELLOR_COLORS.opal700,
        },
        divider: TELLOR_COLORS.opal200,
        error: { main: TELLOR_COLORS.danger },
      };

  return createTheme({
    palette,
    typography: {
      fontFamily: '"Neue Montreal", system-ui, -apple-system, sans-serif',
      fontFamilyMono: '"Inconsolata", ui-monospace, SFMono-Regular, Menlo, monospace',
      h4: { fontWeight: 'bold' },
      subtitle1: { fontWeight: 500 },
      body2: { fontWeight: 400, fontSize: '14px', lineHeight: 1.4 },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: '13px',
            textTransform: 'none',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: '13px',
            fontWeight: 500,
            textTransform: 'none',
            minHeight: 48,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: TELLOR_COLORS.emerald500,
            height: 2,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isDark ? TELLOR_COLORS.neptune300 : TELLOR_COLORS.opal700,
            backgroundColor: palette.background.paper,
            borderBottom: `1px solid ${isDark ? TELLOR_COLORS.darkBorderSoft : TELLOR_COLORS.opal100}`,
          },
          body: {
            fontSize: '13px',
            backgroundColor: palette.background.paper,
            borderBottom: `1px solid ${isDark ? TELLOR_COLORS.darkBorderSoft : TELLOR_COLORS.opal100}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? TELLOR_COLORS.darkBorder : TELLOR_COLORS.opal200}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaginationItem: {
        styleOverrides: {
          root: {
            color: isDark ? TELLOR_COLORS.pine50 : TELLOR_COLORS.pine950,
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: isDark ? TELLOR_COLORS.emerald500 : TELLOR_COLORS.pine950,
          },
        },
      },
    },
  });
}
