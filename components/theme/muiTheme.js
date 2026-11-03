import {createTheme} from '@mui/material/styles';
import {GOV} from './govColors';

const INPUT_BORDER = '#D9DCE7';
const INPUT_BORDER_HOVER = '#B3B9CC';
const SOFT_SHADOW = '0 1px 2px rgba(20, 27, 51, 0.06), 0 1px 3px rgba(20, 27, 51, 0.04)';
const POPUP_SHADOW = '0 12px 32px rgba(20, 27, 51, 0.14)';

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
        // Səhifələrdə əl ilə yazılmış status rəngləri ilə eyni ton
        success: {main: '#1E7A3C'},
        error: {main: '#B42318'},
        warning: {main: '#9A6A00'},
        info: {main: '#1F4E9A'},
        text: {
            primary: GOV.textPrimary,
            secondary: GOV.textMuted,
        },
        background: {
            default: GOV.pageBg,
        },
        divider: GOV.cardBorder,
    },
    typography: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        button: {textTransform: 'none'},
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            defaultProps: {disableElevation: true},
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                    transition: 'background-color .15s, border-color .15s, box-shadow .15s',
                },
                containedPrimary: {
                    '&:hover': {backgroundColor: GOV.navyMid},
                },
                outlined: {
                    borderColor: INPUT_BORDER,
                    '&:hover': {borderColor: INPUT_BORDER_HOVER, backgroundColor: GOV.pageBg},
                },
                text: {
                    '&:hover': {backgroundColor: 'rgba(20, 27, 51, 0.05)'},
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {transition: 'background-color .15s'},
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
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {borderColor: INPUT_BORDER},
                    '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: INPUT_BORDER_HOVER},
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: GOV.navySoft, borderWidth: 1.5},
                    '&.Mui-disabled': {backgroundColor: GOV.pageBg},
                    '&.Mui-error .MuiOutlinedInput-notchedOutline': {borderColor: '#B42318'},
                },
                input: {fontSize: 14},
            },
        },
        MuiInputLabel: {
            styleOverrides: {
                root: {
                    fontSize: 14,
                    '&.Mui-focused': {color: GOV.navySoft},
                },
            },
        },
        MuiFormHelperText: {
            styleOverrides: {
                root: {marginLeft: 2, fontSize: 12},
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {boxShadow: SOFT_SHADOW},
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 16,
                    boxShadow: POPUP_SHADOW,
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {padding: '20px 24px 8px', fontWeight: 700, color: GOV.textPrimary},
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {padding: '8px 24px 16px'},
            },
        },
        MuiBackdrop: {
            styleOverrides: {
                // Menyu/popover-lərin görünməz backdrop-una toxunmur
                root: {
                    '&:not(.MuiBackdrop-invisible)': {
                        backgroundColor: 'rgba(2, 6, 36, 0.45)',
                        backdropFilter: 'blur(2px)',
                    },
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    borderRadius: 12,
                    border: `1px solid ${GOV.cardBorder}`,
                    boxShadow: POPUP_SHADOW,
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {fontSize: 14},
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                paper: {
                    borderRadius: 10,
                    border: `1px solid ${GOV.cardBorder}`,
                    boxShadow: POPUP_SHADOW,
                    fontSize: 14,
                },
                option: {
                    '&.Mui-focused': {backgroundColor: GOV.pageBg},
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    backgroundColor: GOV.gold,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    color: GOV.textMuted,
                    '&.Mui-selected': {color: GOV.textPrimary},
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 600,
                    fontSize: 12.5,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: GOV.navy,
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 6,
                    padding: '6px 10px',
                },
                arrow: {color: GOV.navy},
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {borderRadius: 10},
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {borderRadius: 4},
            },
        },
        MuiLink: {
            defaultProps: {underline: 'hover'},
        },
    },
});