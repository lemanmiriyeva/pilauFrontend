import {createTheme} from '@mui/material/styles';
import {GOV} from './govColors';


export const muiTheme = createTheme({
    palette: {
        primary: {
            main: GOV.navySoft,
            dark: GOV.navy,
        },
        secondary: {
            main: GOV.gold,
            dark: GOV.goldDark,
        },
        text: {
            primary: GOV.textPrimary,
            secondary: GOV.textMuted,
        },
        background: {
            default: GOV.pageBg,
        },
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: 'small',
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 14,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                },
            },
        },
    },
});