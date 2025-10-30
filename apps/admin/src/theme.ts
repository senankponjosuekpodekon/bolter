import { createTheme } from '@mui/material/styles'

export const adminTheme = createTheme({
  palette: {
    primary: {
      main: '#1E3A8A',
    },
    secondary: {
      main: '#0EA5E9',
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
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        },
      },
    },
  },
})
