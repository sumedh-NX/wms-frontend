// src/theme.ts
import { createTheme } from '@mui/material/styles';

// -------------------------------------------------------------------
// Nippon Express (India) colour palette
// -------------------------------------------------------------------
// Primary  : #1B1B4B   (dark navy / brand colour)
// Secondary: #78BE20   (leaf‑green – used for accents & actions)
// -------------------------------------------------------------------

const theme = createTheme({
  palette: {
    // Primary colour – used for AppBar, primary buttons, selected items, etc.
    primary: {
      main: '#1B1B4B',
      contrastText: '#FFFFFF',   // white text looks good on the dark primary
    },

    // Secondary colour – used for secondary buttons, highlights, etc.
    secondary: {
      main: '#78BE20',
      contrastText: '#FFFFFF',
    },

    // Background colours – you can tweak if you want a lighter page background
    background: {
      default: '#F5F5F5',   // very light grey – easy on the eyes
      paper: '#FFFFFF',    // cards, dialogs, paper components
    },

    // Text colours – we keep the default dark text for readability,
    // but we explicitly set primary/secondary overrides just in case.
    text: {
      primary: '#212121',   // default MUI dark‑text colour
      secondary: '#424242',
    },
  },

  // -----------------------------------------------------------------
  // Typography – keep the default Roboto stack (MUI ships it)
  // -----------------------------------------------------------------
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',   // keep button text as‑written (no ALL‑CAPS)
    },
  },

  // -----------------------------------------------------------------
  // Component overrides (optional – you can add more later)
  // -----------------------------------------------------------------
  components: {
    // Example: make all contained buttons use the secondary colour by default
    // (feel free to delete if you don’t want this behaviour)
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        containedSecondary: {
          backgroundColor: '#78BE20',
          '&:hover': {
            backgroundColor: '#64A61A',
          },
        },
      },
    },
  },
});

export default theme;
