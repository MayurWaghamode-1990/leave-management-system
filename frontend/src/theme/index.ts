import { createTheme, alpha, Theme } from '@mui/material/styles'

// Modern Color Palette
const colors = {
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientAlt: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
  },
  secondary: {
    50: '#fce4ec',
    100: '#f8bbd0',
    200: '#f48fb1',
    300: '#f06292',
    400: '#ec407a',
    500: '#e91e63',
    600: '#d81b60',
    700: '#c2185b',
    800: '#ad1457',
    900: '#880e4f',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  success: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  },
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800',
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336',
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  info: {
    50: '#e1f5fe',
    100: '#b3e5fc',
    200: '#81d4fa',
    300: '#4fc3f7',
    400: '#29b6f6',
    500: '#03a9f4',
    600: '#039be5',
    700: '#0288d1',
    800: '#0277bd',
    900: '#01579b',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
  },
}

// Custom shadows for depth
const shadows = [
  'none',
  '0px 2px 4px rgba(0, 0, 0, 0.05)',
  '0px 4px 8px rgba(0, 0, 0, 0.08)',
  '0px 6px 12px rgba(0, 0, 0, 0.1)',
  '0px 8px 16px rgba(0, 0, 0, 0.12)',
  '0px 12px 24px rgba(0, 0, 0, 0.15)',
  '0px 16px 32px rgba(0, 0, 0, 0.18)',
  '0px 20px 40px rgba(0, 0, 0, 0.2)',
  '0px 24px 48px rgba(0, 0, 0, 0.22)',
  '0px 2px 8px rgba(103, 126, 234, 0.15)',
  '0px 4px 16px rgba(103, 126, 234, 0.2)',
  '0px 8px 24px rgba(103, 126, 234, 0.25)',
  '0px 12px 32px rgba(103, 126, 234, 0.3)',
  '0px 16px 40px rgba(103, 126, 234, 0.35)',
  '0px 20px 48px rgba(103, 126, 234, 0.4)',
  '0px 24px 56px rgba(103, 126, 234, 0.45)',
  '0px 2px 12px rgba(0, 0, 0, 0.08)',
  '0px 4px 20px rgba(0, 0, 0, 0.12)',
  '0px 8px 28px rgba(0, 0, 0, 0.16)',
  '0px 12px 36px rgba(0, 0, 0, 0.2)',
  '0px 16px 44px rgba(0, 0, 0, 0.24)',
  '0px 20px 52px rgba(0, 0, 0, 0.28)',
  '0px 24px 60px rgba(0, 0, 0, 0.32)',
  '0px 28px 68px rgba(0, 0, 0, 0.36)',
  '0px 32px 76px rgba(0, 0, 0, 0.4)',
]

// Create base theme
const createAppTheme = (mode: 'light' | 'dark' = 'light'): Theme => {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.primary[600],
        light: colors.primary[400],
        dark: colors.primary[800],
        contrastText: '#ffffff',
      },
      secondary: {
        main: colors.secondary[500],
        light: colors.secondary[300],
        dark: colors.secondary[700],
        contrastText: '#ffffff',
      },
      success: {
        main: colors.success[600],
        light: colors.success[400],
        dark: colors.success[800],
        contrastText: '#ffffff',
      },
      warning: {
        main: colors.warning[600],
        light: colors.warning[400],
        dark: colors.warning[800],
        contrastText: '#ffffff',
      },
      error: {
        main: colors.error[600],
        light: colors.error[400],
        dark: colors.error[800],
        contrastText: '#ffffff',
      },
      info: {
        main: colors.info[600],
        light: colors.info[400],
        dark: colors.info[800],
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0a0e27' : '#f5f7fa',
        paper: isDark ? '#1a1f3a' : '#ffffff',
      },
      text: {
        primary: isDark ? '#ffffff' : '#1a202c',
        secondary: isDark ? '#a0aec0' : '#4a5568',
      },
      divider: isDark ? alpha('#ffffff', 0.12) : alpha('#000000', 0.08),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '3.5rem',
        fontWeight: 800,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2.75rem',
        fontWeight: 700,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontSize: '1.875rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.005em',
      },
      h5: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      subtitle1: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.6,
      },
      subtitle2: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.6,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.02em',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
      overline: {
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 2,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: shadows as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDark ? '#1a1f3a' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#4a5568' : '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                background: isDark ? '#718096' : '#a1a1a1',
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: '0.9375rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            background: colors.primary.gradient,
            color: '#ffffff',
            '&:hover': {
              background: colors.primary.gradient,
              opacity: 0.9,
            },
          },
          outlined: {
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              background: alpha(colors.primary[600], 0.04),
            },
          },
          text: {
            '&:hover': {
              background: alpha(colors.primary[600], 0.08),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: isDark ? `1px solid ${alpha('#ffffff', 0.1)}` : 'none',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDark
                ? '0 12px 32px rgba(0, 0, 0, 0.5)'
                : '0 12px 32px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 16,
          },
          elevation1: {
            boxShadow: isDark
              ? '0 2px 8px rgba(0, 0, 0, 0.4)'
              : '0 2px 8px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[400],
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                },
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: '0.8125rem',
          },
          filled: {
            '&.MuiChip-colorPrimary': {
              background: colors.primary.gradient,
            },
            '&.MuiChip-colorSecondary': {
              background: colors.secondary.gradient,
            },
            '&.MuiChip-colorSuccess': {
              background: colors.success.gradient,
            },
            '&.MuiChip-colorWarning': {
              background: colors.warning.gradient,
            },
            '&.MuiChip-colorError': {
              background: colors.error.gradient,
            },
            '&.MuiChip-colorInfo': {
              background: colors.info.gradient,
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
          colorDefault: {
            background: colors.primary.gradient,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            height: 8,
          },
          bar: {
            borderRadius: 10,
            background: colors.primary.gradient,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#2d3748' : '#1a202c',
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: 8,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontSize: '0.9375rem',
            fontWeight: 500,
          },
          standardSuccess: {
            background: isDark
              ? alpha(colors.success[500], 0.15)
              : alpha(colors.success[50], 1),
          },
          standardError: {
            background: isDark
              ? alpha(colors.error[500], 0.15)
              : alpha(colors.error[50], 1),
          },
          standardWarning: {
            background: isDark
              ? alpha(colors.warning[500], 0.15)
              : alpha(colors.warning[50], 1),
          },
          standardInfo: {
            background: isDark
              ? alpha(colors.info[500], 0.15)
              : alpha(colors.info[50], 1),
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: isDark
              ? 'linear-gradient(180deg, #1a1f3a 0%, #0f1729 100%)'
              : 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  })
}

// Export theme and utilities
export const lightTheme = createAppTheme('light')
export const darkTheme = createAppTheme('dark')
export { colors, createAppTheme }
export default lightTheme
