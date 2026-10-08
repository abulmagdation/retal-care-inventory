import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: '#34534F', dark: '#284640', light: '#DCEBE7', contrastText: '#FFFFFF' },
    secondary: { main: '#C49A2C', light: '#F5E9C7', dark: '#8F6C13' },
    error: { main: '#B44A3D', light: '#FBE7E3' },
    warning: { main: '#A77813', light: '#FFF1D4' },
    success: { main: '#347566', light: '#DCEFE8' },
    background: { default: '#E7F1EF', paper: '#FFFFFF' },
    text: { primary: '#25413D', secondary: '#718782' },
  },
  shape: { borderRadius: 20 },
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
        root: { borderRadius: 16, paddingInline: 20, minHeight: 48, letterSpacing: 0, fontSize: 13.5 },
        sizeSmall: { minHeight: 38, paddingInline: 14, fontSize: 12.5 },
        startIcon: { marginInlineStart: 0, marginInlineEnd: 9 },
        endIcon: { marginInlineStart: 9, marginInlineEnd: 0 },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 27, border: '1px solid rgba(56,86,80,.06)', boxShadow: '0 18px 50px rgba(31, 64, 57, .055)' } },
    },
    MuiTextField: { defaultProps: { size: 'medium' } },
    MuiFormControl: { defaultProps: { size: 'medium' } },
    MuiOutlinedInput: { styleOverrides: {
      root: {
        borderRadius: 16, minHeight: 56, backgroundColor: '#fff',
        transition: 'box-shadow .18s ease, background-color .18s ease',
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#91B0A8' },
        '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(52, 83, 79, .1)' },
      },
      input: { paddingBlock: 15, fontSize: 14 },
      notchedOutline: { borderColor: '#D7E4E0' },
    } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 14, color: '#647E78' } } },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 44, borderRadius: 8, marginInline: 5 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 10, fontWeight: 700 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 26, boxShadow: '0 28px 80px rgba(26, 60, 53, .18)' } } },
    MuiDialogTitle: { styleOverrides: { root: { padding: '24px 28px 18px', fontWeight: 800, fontSize: 18 } } },
    MuiDialogContent: { styleOverrides: { root: { padding: '24px 28px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '18px 28px 24px', gap: 8 } } },
    MuiTableCell: {
      styleOverrides: {
        head: { color: '#4F6B65', fontWeight: 800, fontSize: 12.5, background: '#F1F7F5', borderBottomColor: '#E3EEEA', textAlign: 'right', padding: '16px 18px' },
        body: { borderBottomColor: '#EDF3F1', textAlign: 'right', padding: '17px 18px', fontSize: 13.5 },
      },
    },
    MuiTableRow: { styleOverrides: { root: { '&:hover': { backgroundColor: '#F7FBF9' } } } },
    MuiPaginationItem: { styleOverrides: { root: { borderRadius: 10, minWidth: 34, height: 34 } } },
    MuiAutocomplete: { styleOverrides: { paper: { borderRadius: 16, marginTop: 8, boxShadow: '0 18px 45px rgba(25, 55, 47, .14)' } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontFamily: '"Cairo", sans-serif', borderRadius: 9 } } },
  },
});
