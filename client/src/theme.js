import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: '#2457D6', dark: '#173EAD', light: '#DBE7FF', contrastText: '#FFFFFF' },
    secondary: { main: '#4D69A7', light: '#E5EDFF', dark: '#30497F' },
    error: { main: '#BA1A1A', light: '#FFDAD6' },
    warning: { main: '#9A5B00', light: '#FFDEA6' },
    success: { main: '#237A4B', light: '#D5F5E3' },
    background: { default: '#F5F7FC', paper: '#FFFFFF' },
    text: { primary: '#17233A', secondary: '#64728A' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Cairo", "Segoe UI", Tahoma, sans-serif',
    fontSize: 14.5,
    h1: { fontWeight: 800, letterSpacing: '-0.04em' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 14, paddingInline: 20, minHeight: 48, letterSpacing: 0, fontSize: 13.5 },
        sizeSmall: { minHeight: 38, paddingInline: 14, fontSize: 12.5 },
        startIcon: { marginInlineStart: 0, marginInlineEnd: 9 },
        endIcon: { marginInlineStart: 9, marginInlineEnd: 0 },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 24, border: '1px solid #DFE7F4', boxShadow: '0 12px 36px rgba(31, 65, 133, .055)' } },
    },
    MuiTextField: { defaultProps: { size: 'medium' } },
    MuiFormControl: { defaultProps: { size: 'medium' } },
    MuiOutlinedInput: { styleOverrides: {
      root: {
        borderRadius: 14, minHeight: 54, backgroundColor: '#fff',
        transition: 'box-shadow .18s ease, background-color .18s ease',
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#91ACE7' },
        '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(36, 87, 214, .1)' },
      },
      input: { paddingBlock: 15, fontSize: 14 },
      notchedOutline: { borderColor: '#D8E2F0' },
    } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 14, color: '#5B6B84' } } },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 44, borderRadius: 8, marginInline: 5 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 10, fontWeight: 700 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 26, boxShadow: '0 28px 80px rgba(25, 47, 93, .18)' } } },
    MuiDialogTitle: { styleOverrides: { root: { padding: '24px 28px 18px', fontWeight: 800, fontSize: 18 } } },
    MuiDialogContent: { styleOverrides: { root: { padding: '24px 28px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '18px 28px 24px', gap: 8 } } },
    MuiTableCell: {
      styleOverrides: {
        head: { color: '#52637F', fontWeight: 800, fontSize: 12.5, background: '#F5F8FE', borderBottomColor: '#E4EAF4', textAlign: 'right', padding: '15px 18px' },
        body: { borderBottomColor: '#E8EDF5', textAlign: 'right', padding: '17px 18px', fontSize: 13.5 },
      },
    },
    MuiTableRow: { styleOverrides: { root: { '&:hover': { backgroundColor: '#F8FAFF' } } } },
    MuiPaginationItem: { styleOverrides: { root: { borderRadius: 10, minWidth: 34, height: 34 } } },
    MuiAutocomplete: { styleOverrides: { paper: { borderRadius: 16, marginTop: 8, boxShadow: '0 18px 45px rgba(25, 47, 93, .14)' } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontFamily: '"Cairo", sans-serif', borderRadius: 9 } } },
  },
});
