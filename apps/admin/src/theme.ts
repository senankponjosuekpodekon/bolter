import { createTheme } from '@mui/material/styles'
import { ADMIN_TOKENS } from './themeTokens'

export const adminTheme = createTheme({
  palette: {
    primary: {
      main: ADMIN_TOKENS.colors.primary,
    },
    secondary: {
      main: ADMIN_TOKENS.colors.primaryLight || '#0EA5E9',
    },
    background: {
      default: '#F4F6FB',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: ADMIN_TOKENS.layout.borderRadius,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: ADMIN_TOKENS.layout.cardRadius,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        },
      },
    },
  },
})
