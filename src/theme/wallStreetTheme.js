import { createTheme } from '@mui/material/styles';
import { colors } from './colors';
import { fontFamilies } from './typography';

export const wallStreetTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.terminal.green,
      dark: colors.terminal.darkGreen,
      light: colors.terminal.greenMuted,
    },
    secondary: {
      main: colors.terminal.amber,
      dark: colors.terminal.amberDim,
    },
    error: {
      main: colors.terminal.red,
    },
    info: {
      main: colors.terminal.cyan,
    },
    background: {
      default: colors.terminal.bg,
      paper: colors.surface.primary,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    divider: colors.surface.border,
  },
  typography: {
    fontFamily: fontFamilies.body,
    h1: {
      fontFamily: fontFamilies.display,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: fontFamilies.display,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: fontFamilies.display,
      fontWeight: 600,
    },
    h4: {
      fontFamily: fontFamilies.display,
      fontWeight: 600,
    },
    h5: {
      fontFamily: fontFamilies.display,
      fontWeight: 500,
    },
    h6: {
      fontFamily: fontFamilies.display,
      fontWeight: 500,
    },
    body1: {
      fontFamily: fontFamilies.body,
    },
    body2: {
      fontFamily: fontFamilies.body,
    },
    button: {
      fontFamily: fontFamilies.body,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    caption: {
      fontFamily: fontFamilies.body,
      color: colors.text.secondary,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.terminal.bg,
          color: colors.text.primary,
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.surface.borderLight} ${colors.surface.primary}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.surface.primary,
          border: `1px solid ${colors.surface.border}`,
          boxShadow: `0 0 8px rgba(0, 255, 65, 0.05)`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.surface.primary,
          border: `1px solid ${colors.surface.border}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 600,
        },
        contained: {
          backgroundColor: colors.terminal.darkGreen,
          color: colors.terminal.green,
          border: `1px solid ${colors.terminal.dimGreen}`,
          '&:hover': {
            backgroundColor: 'rgba(0, 255, 65, 0.15)',
            boxShadow: `0 0 15px rgba(0, 255, 65, 0.2)`,
            borderColor: colors.terminal.green,
          },
        },
        outlined: {
          borderColor: colors.surface.border,
          color: colors.text.primary,
          '&:hover': {
            borderColor: colors.terminal.dimGreen,
            backgroundColor: 'rgba(0, 255, 65, 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: colors.surface.elevated,
            fontFamily: fontFamilies.mono,
            '& fieldset': {
              borderColor: colors.surface.border,
            },
            '&:hover fieldset': {
              borderColor: colors.surface.borderLight,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.terminal.dimGreen,
              boxShadow: `0 0 8px rgba(0, 255, 65, 0.15)`,
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.text.secondary,
          },
          '& .MuiOutlinedInput-input': {
            color: colors.terminal.green,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: colors.surface.border,
          color: colors.text.primary,
        },
        head: {
          color: colors.terminal.amber,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: `rgba(0, 255, 65, 0.03) !important`,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.surface.overlay,
          border: `1px solid ${colors.surface.border}`,
          color: colors.text.primary,
          fontFamily: fontFamilies.body,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          color: colors.terminal.green,
        },
        thumb: {
          '&:hover': {
            boxShadow: `0 0 0 8px rgba(0, 255, 65, 0.15)`,
          },
        },
        track: {
          border: 'none',
        },
        rail: {
          backgroundColor: colors.surface.borderLight,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
          '&.Mui-selected': {
            color: colors.terminal.green,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: colors.terminal.green,
          boxShadow: `0 0 8px rgba(0, 255, 65, 0.3)`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderColor: colors.surface.border,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.surface.primary,
          border: `1px solid ${colors.surface.border}`,
        },
      },
    },
  },
});
