import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Autocomplete, Avatar, Badge, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, Container, Dialog,
  CssBaseline, DialogActions, DialogContent, DialogTitle, Divider, Drawer, FormControl, FormControlLabel, IconButton,
  InputAdornment, InputLabel, LinearProgress, Menu, MenuItem, Pagination, Select, Snackbar, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, ThemeProvider,
  Toolbar, Tooltip, Typography,
} from '@mui/material';
import {
  AddRounded, AssignmentReturnRounded, CalendarMonthRounded, CloseRounded, DashboardRounded,
  DevicesOtherRounded, EventBusyRounded, Groups2Rounded, Inventory2Rounded, KeyRounded,
  LocalHospitalRounded, LogoutRounded, MenuRounded, MoreHorizRounded, NotificationsActiveRounded,
  PaymentsRounded, PersonAddAltRounded, PhoneRounded, SearchRounded, ShieldRounded,
  SwapHorizRounded, TimelapseRounded, WarningAmberRounded,
} from '@mui/icons-material';
import { theme } from './theme';
import { api, isDemo } from './api';

const drawerWidth = 272;
const arNumber = new Intl.NumberFormat('ar-EG');
const money = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });
const fmtDate = (date) => date ? new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date)) : '—';
const daysLeft = (date) => Math.ceil((new Date(date).setHours(23, 59, 59) - Date.now()) / 86400000);
const imageSrc = (image) => image.previewUrl || `${import.meta.env.VITE_API_URL || '/api'}/devices/images/${image.fileId}`;

const statusMap = {
  available: { label: 'متاح', color: 'success', bg: '#E0F4E9', fg: '#17683C' },
  rented: { label: 'مؤجّر', color: 'secondary', bg: '#EAE9FF', fg: '#4B4BB2' },
  maintenance: { label: 'صيانة', color: 'warning', bg: '#FFF0D2', fg: '#845000' },
  reserved: { label: 'محجوز', color: 'info', bg: '#DDEEFE', fg: '#195B8D' },
  active: { label: 'نشط', color: 'success', bg: '#E0F4E9', fg: '#17683C' },
  completed: { label: 'تم الإرجاع', color: 'default', bg: '#EEF1F0', fg: '#53605C' },
  overdue: { label: 'متأخر', color: 'error', bg: '#FFE2DE', fg: '#A21A18' },
  cancelled: { label: 'ملغي', color: 'default', bg: '#EEF1F0', fg: '#53605C' },
};
const roles = { admin: 'مدير النظام', storekeeper: 'مسؤول مخزن', viewer: 'مشاهدة فقط' };
const movementTypes = {
  added: 'إضافة للمخزون', rented: 'تأجير', returned: 'استلام وإرجاع', maintenance_in: 'دخول صيانة',
  maintenance_out: 'خروج من الصيانة', transferred: 'نقل موقع', updated: 'تعديل بيانات', extended: 'تمديد إيجار',
};

function Brand({ light = false }) {
  return <Stack direction="row" alignItems="center" spacing={1.5}>
    <Box><Typography fontWeight={800} fontSize={20} lineHeight={1.2}>رتال كير</Typography><Typography fontSize={11} sx={{ opacity: .68 }}>مخزون الأجهزة</Typography></Box>
  </Stack>;
}

function StatusChip({ status }) {
  const x = statusMap[status] || statusMap.available;
  return <Chip size="small" label={<Stack direction="row" spacing={.7} alignItems="center"><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: x.fg }} /><span>{x.label}</span></Stack>} sx={{ bgcolor: x.bg, color: x.fg, border: `1px solid ${x.fg}15`, height: 29, '& .MuiChip-label': { px: 1.2 } }} />;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState(isDemo ? 'admin@retalcare.com' : '');
  const [password, setPassword] = useState(isDemo ? 'demo1234' : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { const result = await api.login(email, password); onLogin(result.user); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  return <Box className="login-shell">
    <Box className="login-panel">
      <Box className="mobile-brand" mb={6}><Brand /></Box>
      <Typography className="eyebrow" mb={1.5}>بوابة إدارة المخزون</Typography>
      <Typography variant="h3" fontSize={{ xs: 32, md: 40 }} mb={1}>أهلًا بعودتك</Typography>
      <Typography color="text.secondary" mb={4}>سجّل الدخول لمتابعة الأجهزة وعقود الإيجار من مكان واحد.</Typography>
      {isDemo && <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>وضع العرض مفعّل — يمكنك الدخول بالبيانات المكتوبة.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2.2}>
          <TextField required fullWidth label="البريد الإلكتروني" type="email" value={email} onChange={(e) => setEmail(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Groups2Rounded color="action" /></InputAdornment> }} />
          <TextField required fullWidth label="كلمة المرور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} inputProps={{ minLength: 4 }} InputProps={{ startAdornment: <InputAdornment position="start"><KeyRounded color="action" /></InputAdornment> }} />
          <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ height: 52 }}>{loading ? <CircularProgress size={24} color="inherit" /> : 'تسجيل الدخول'}</Button>
        </Stack>
      </Box>
      <Typography variant="caption" color="text.secondary" mt={4}>الدخول متاح فقط للمستخدمين المضافين من مسؤول النظام.</Typography>
    </Box>
    <Box className="login-visual">
      <Box className="login-grid" />
      <Box sx={{ position: 'relative', zIndex: 1 }}><Brand light /></Box>
      <Box className="visual-card">
        <Typography variant="h3" fontSize={34} mb={2}>كل جهاز في مكانه.<br />وكل موعد تحت عينك.</Typography>
        <Typography sx={{ opacity: .78, maxWidth: 420, lineHeight: 1.9 }}>من لحظة دخول الجهاز للمخزن وحتى تسليمه واسترداده، لديك سجل واضح يساعدك تتصرف في الوقت الصحيح.</Typography>
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,.16)' }} />
        <Typography fontSize={13}><span className="pulse-dot" /> النظام جاهز لمتابعة مخزونك</Typography>
      </Box>
      <Typography variant="caption" sx={{ position: 'relative', zIndex: 1, opacity: .62 }}>Retal Care Operations Suite · 2026</Typography>
    </Box>
  </Box>;
}

const navItems = [
  { path: '/', label: 'نظرة عامة', icon: DashboardRounded },
  { path: '/devices', label: 'الأجهزة', icon: DevicesOtherRounded },
  { path: '/rentals', label: 'عقود الإيجار', icon: SwapHorizRounded },
  { path: '/alerts', label: 'تنبيهات الاسترداد', icon: NotificationsActiveRounded },
  { path: '/users', label: 'المستخدمون', icon: Groups2Rounded },
];

function Shell({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation(); const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const refresh = () => api.alertsCount().then((r) => { if (active) setAlertCount(r.count); }).catch(() => {});
    refresh();
    const interval = setInterval(refresh, 60000);
    window.addEventListener('retal-data-changed', refresh);
    return () => { active = false; clearInterval(interval); window.removeEventListener('retal-data-changed', refresh); };
  }, [location.pathname]);
  const visibleNavItems = user.role === 'admin' ? navItems : navItems.filter((item) => item.path !== '/users');
  const current = location.pathname === '/logs' ? { label: 'سجل التدقيق' } : location.pathname.startsWith('/devices/') ? { label: 'تفاصيل الجهاز' } : visibleNavItems.find((n) => n.path === location.pathname) || visibleNavItems[0];
  const drawer = <Box sx={{ height: '100%', bgcolor: '#EFF3FC', p: 2.2, display: 'flex', flexDirection: 'column' }}>
    <Box px={1} py={1.4} mb={3}><Brand /></Box>
    <Typography variant="caption" fontWeight={700} color="text.secondary" px={1.5} mb={1}>مساحة العمل</Typography>
    <Stack spacing={.65}>{visibleNavItems.map((item) => {
      const active = location.pathname === item.path; const Icon = item.icon;
      return <Button className={`nav-button ${active ? 'active' : ''}`} key={item.path} onClick={() => { navigate(item.path); setMobileOpen(false); }} sx={{ justifyContent: 'flex-start', color: active ? 'primary.dark' : 'text.secondary', bgcolor: active ? '#DBE7FF' : 'transparent', px: 1.1, py: .7, '&:hover': { bgcolor: active ? '#DBE7FF' : '#E3EBFB' } }}><Box className="nav-icon"><Icon fontSize="small" /></Box><Box component="span" sx={{ fontWeight: active ? 800 : 650 }}>{item.label}</Box>{item.path === '/alerts' && alertCount > 0 && <Box component="span" sx={{ marginInlineStart: 'auto', bgcolor: '#C13232', color: '#fff', borderRadius: 8, minWidth: 22, px: .7, fontSize: 11 }}>{arNumber.format(alertCount)}</Box>}{active && item.path !== '/alerts' && <Box className="nav-indicator" />}</Button>;
    })}</Stack>
    <Box sx={{ mt: 'auto' }}>
      <Card sx={{ bgcolor: '#E1EAFB', boxShadow: 'none', border: 0, mb: 1.5 }}><CardContent sx={{ p: '14px !important' }}><Stack direction="row" spacing={1.3} alignItems="center"><Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontSize: 14 }}>{user.name?.slice(0, 1)}</Avatar><Box minWidth={0}><Typography fontWeight={700} fontSize={13} noWrap>{user.name}</Typography><Typography fontSize={10.5} color="text.secondary">{roles[user.role]}</Typography></Box></Stack></CardContent></Card>
      <Button fullWidth color="inherit" onClick={onLogout} sx={{ justifyContent: 'flex-start', color: 'text.secondary', gap: 1.2, px: 1.5 }}><LogoutRounded fontSize="small" />تسجيل الخروج</Button>
    </Box>
  </Box>;
  return <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer anchor="right" variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 0 } }}>{drawer}</Drawer>
      <Drawer anchor="right" variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 0 } }}>{drawer}</Drawer>
    </Box>
    <Box component="main" className="app-canvas" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` }, minWidth: 0 }}>
      <Toolbar sx={{ height: 76, bgcolor: 'rgba(248,250,255,.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #E1E8F3', position: 'sticky', top: 0, zIndex: 10, px: { xs: 2, md: 4 } }}>
        <IconButton aria-label="فتح القائمة" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, ml: 1 }}><MenuRounded /></IconButton>
        <Typography className="topbar-title" fontWeight={800} fontSize={14}>{current.label}</Typography>
        <Box sx={{ marginInlineStart: 'auto' }}><Tooltip title="التنبيهات"><IconButton className="action-icon" aria-label={`فتح التنبيهات، ${alertCount} مستحقة`} onClick={() => navigate('/alerts')}><Badge badgeContent={alertCount} color="error" max={99}><NotificationsActiveRounded fontSize="small" /></Badge></IconButton></Tooltip></Box>
      </Toolbar>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4.5 }, px: { xs: 2, md: 4 } }}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} /><Route path="/devices" element={<Devices user={user} />} /><Route path="/devices/:id" element={<DeviceDetails />} />
          <Route path="/rentals" element={<Rentals user={user} />} /><Route path="/alerts" element={<AlertsPage />} />
          <Route path="/users" element={user.role === 'admin' ? <Users currentUser={user} /> : <Navigate to="/" replace />} />
          <Route path="/logs" element={user.role === 'admin' ? <Logs /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  </Box>;
}

function PageHeader({ eyebrow, title, subtitle, action }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} mb={3.5}>
    <Box className="page-heading"><Typography className="eyebrow" mb={.7}>{eyebrow}</Typography><Typography className="page-title" variant="h4" mb={.5}>{title}</Typography><Typography color="text.secondary" fontSize={13.5}>{subtitle}</Typography></Box>{action && <Box sx={{ flex: '0 0 auto' }}>{action}</Box>}
  </Stack>;
}
function Loading() { return <Box py={10} textAlign="center"><CircularProgress /></Box>; }
function Pager({ page, total, limit = 10, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages < 2) return null;
  const start = (page - 1) * limit + 1;
  return <Box className="pager"><Typography fontSize={12} color="text.secondary">عرض {arNumber.format(start)}–{arNumber.format(Math.min(page * limit, total))} من {arNumber.format(total)}</Typography><Pagination count={pages} page={page} onChange={(_event, value) => onChange(value)} color="primary" shape="rounded" size="small" siblingCount={0} boundaryCount={1} /></Box>;
}
function StatCard({ title, value, note, icon: Icon, tint = '#2457D6', pale = '#E4ECFF' }) {
  return <Card className="stat-card" sx={{ color: tint }}><CardContent sx={{ p: '22px !important' }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography fontSize={12.5} fontWeight={700} color="text.secondary" mb={1}>{title}</Typography><Typography variant="h4" color="text.primary" lineHeight={1.1}>{value}</Typography><Typography fontSize={11.5} mt={1.2} color="text.secondary">{note}</Typography></Box><Avatar variant="rounded" sx={{ bgcolor: pale, color: tint, width: 48, height: 48, borderRadius: 3.5, boxShadow: `0 8px 20px ${tint}18` }}><Icon /></Avatar></Stack></CardContent></Card>;
}

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => { api.dashboard().then(setData); }, []);
  if (!data) return <Loading />;
  const total = data.counts.total || 1;
  return <>
    <PageHeader eyebrow={new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())} title="صباح الخير 👋" subtitle="هذه هي حالة المخزون وعقود الإيجار اليوم." action={user.role !== 'viewer' && <Button variant="contained" startIcon={<AddRounded />} onClick={() => navigate('/devices?add=1')}>إضافة جهاز</Button>} />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', xl: 'repeat(4, 1fr)' }, gap: 2.2, mb: 3 }}>
      <StatCard title="إجمالي الأجهزة" value={arNumber.format(data.counts.total)} note="كل أجهزة المخزون" icon={Inventory2Rounded} />
      <StatCard title="أجهزة متاحة" value={arNumber.format(data.counts.available)} note={`${Math.round(data.counts.available / total * 100)}٪ من المخزون`} icon={DevicesOtherRounded} tint="#386CDE" pale="#E1EBFF" />
      <StatCard title="أجهزة مؤجّرة" value={arNumber.format(data.counts.rented)} note="لدى العملاء حاليًا" icon={SwapHorizRounded} tint="#5B6EAA" pale="#E9EDFA" />
      <StatCard title="عقود متأخرة" value={arNumber.format(data.counts.overdue)} note="تحتاج متابعة عاجلة" icon={EventBusyRounded} tint="#B3261E" pale="#FFE2DE" />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1.45fr) minmax(320px,.75fr)' }, gap: 2.4 }}>
      <Card><CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}><Box><Typography variant="h6">أقرب مواعيد الاسترداد</Typography><Typography variant="caption" color="text.secondary">العقود التي تتطلب متابعة أولًا</Typography></Box><Button size="small" onClick={() => navigate('/alerts')}>عرض الكل</Button></Stack>
        <Stack spacing={1.4}>{data.expiringSoon.slice(0, 4).map((r) => <RentalAlert key={r._id} rental={r} compact />)}</Stack>
      </CardContent></Card>
      <Stack spacing={2.4}>
        <Card><CardContent sx={{ p: 3 }}><Typography variant="h6" mb={2}>توزيع حالة الأجهزة</Typography>
          {[['متاح', data.counts.available, '#386CDE'], ['مؤجّر', data.counts.rented, '#7894DA'], ['في الصيانة', data.counts.maintenance, '#C47700']].map(([label, count, color]) => <Box key={label} mb={2}><Stack direction="row" justifyContent="space-between" mb={.7}><Typography fontSize={13}>{label}</Typography><Typography fontSize={13} fontWeight={800}>{arNumber.format(count)}</Typography></Stack><Box className="progress-track"><Box className="progress-fill" sx={{ width: `${count / total * 100}%`, bgcolor: color }} /></Box></Box>)}
        </CardContent></Card>
        <Card sx={{ background: 'linear-gradient(135deg,#173D9B,#2457D6 72%,#5B80E7)', color: '#fff' }}><CardContent sx={{ p: 3 }}><Stack direction="row" justifyContent="space-between"><Box><Typography fontSize={12} sx={{ opacity: .7 }}>قيمة الإيجارات النشطة</Typography><Typography variant="h5" mt={.7}>{money.format(data.financials.activeRentalValue)}</Typography></Box><PaymentsRounded sx={{ opacity: .7 }} /></Stack><Divider sx={{ borderColor: 'rgba(255,255,255,.15)', my: 2 }} /><Typography fontSize={12} sx={{ opacity: .72 }}>التأمينات المحتفظ بها: {money.format(data.financials.depositsHeld)}</Typography></CardContent></Card>
      </Stack>
    </Box>
  </>;
}

function RentalAlert({ rental, compact = false, onReturn, onExtend, onOpen }) {
  const days = daysLeft(rental.endDate); const finished = ['completed', 'cancelled'].includes(rental.status); const overdue = !finished && days < 0;
  return <Box className="alert-strip" onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onKeyDown={onOpen ? (event) => { if (event.key === 'Enter' && event.target === event.currentTarget) onOpen(); } : undefined} sx={{ cursor: onOpen ? 'pointer' : 'default', bgcolor: finished ? '#F3F6FC' : overdue ? '#FFF3F1' : days <= 3 ? '#FFF8EB' : '#F3F6FC', borderColor: finished ? '#E1E8F3' : overdue ? '#FFD4CF' : days <= 3 ? '#F5D9A7' : '#E1E8F3' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5}>
      <Avatar variant="rounded" sx={{ bgcolor: overdue ? '#FFE0DC' : '#E4ECFF', color: overdue ? 'error.main' : 'primary.main' }}>{overdue ? <WarningAmberRounded /> : <TimelapseRounded />}</Avatar>
      <Box flex={1} minWidth={0}><Typography fontWeight={800} fontSize={14}>{rental.device?.name}</Typography><Typography variant="caption" color="text.secondary">{rental.customer?.name} · {rental.customer?.phone}</Typography></Box>
      <Box textAlign="right"><Typography fontWeight={800} fontSize={13} color={overdue ? 'error.main' : !finished && days <= 3 ? 'warning.main' : 'text.primary'}>{finished ? statusMap[rental.status].label : overdue ? `متأخر ${arNumber.format(Math.abs(days))} يوم` : days === 0 ? 'ينتهي اليوم' : `متبقي ${arNumber.format(days)} يوم`}</Typography><Typography variant="caption" color="text.secondary">{fmtDate(rental.endDate)}</Typography></Box>
      {!compact && (onReturn || onExtend) && <Stack direction="row" spacing={1}>{onExtend && <Button size="small" variant="outlined" onClick={(event) => { event.stopPropagation(); onExtend(rental); }}>تمديد</Button>}{onReturn && <Button size="small" variant="contained" color="success" onClick={(event) => { event.stopPropagation(); onReturn(rental); }}>استلام</Button>}</Stack>}
    </Stack>
  </Box>;
}

function Devices({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [devices, setDevices] = useState([]); const [search, setSearch] = useState(''); const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null); const [menu, setMenu] = useState(null); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  useEffect(() => {
    if (new URLSearchParams(location.search).get('add') === '1' && user.role !== 'viewer') {
      setEditing(null);
      setOpen(true);
      navigate('/devices', { replace: true });
    }
  }, [location.search, navigate, user.role]);
  const load = () => { setLoading(true); api.devices({ q: search, status: statusFilter, page }).then((r) => { setDevices(r.devices); setTotal(r.total); }).catch((err) => setError(err.message)).finally(() => setLoading(false)); };
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { setLoading(true); api.devices({ q: search, status: statusFilter, page }).then((r) => { if (active) { setDevices(r.devices); setTotal(r.total); if (page > 1 && r.total <= (page - 1) * 10) setPage(Math.max(1, Math.ceil(r.total / 10))); } }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); }); }, search ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [search, statusFilter, page]);
  return <>
    <PageHeader eyebrow="المخزون الطبي" title="الأجهزة" subtitle="اعثر على أي جهاز بالاسم أو الرقم التسلسلي وتابع حالته." action={user.role !== 'viewer' && <Button variant="contained" startIcon={<AddRounded />} onClick={() => { setEditing(null); setOpen(true); }}>إضافة جهاز</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
    <Card><CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2.5} alignItems={{ sm: 'center' }} mb={3}><TextField className="search-field" fullWidth placeholder="ابحث باسم الجهاز أو الرقم التسلسلي..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded color="action" /></InputAdornment> }} /><FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}><InputLabel>حالة الجهاز</InputLabel><Select value={statusFilter} label="حالة الجهاز" onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><MenuItem value="">كل الحالات</MenuItem><MenuItem value="available">متاح</MenuItem><MenuItem value="rented">مؤجّر</MenuItem><MenuItem value="maintenance">في الصيانة</MenuItem><MenuItem value="reserved">محجوز</MenuItem></Select></FormControl><Chip label={`${arNumber.format(total)} أجهزة`} sx={{ bgcolor: '#E5EDFF', color: 'primary.dark', flex: '0 0 auto' }} /></Stack>
      {loading ? <LinearProgress /> : devices.length > 0 && <TableContainer><Table><TableHead><TableRow><TableCell>الجهاز</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>الرقم التسلسلي</TableCell><TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>الموقع / الملحقات</TableCell><TableCell>الحالة</TableCell><TableCell>إجراء</TableCell></TableRow></TableHead><TableBody>{devices.map((d) => <TableRow key={d._id} className="device-row"><TableCell><Stack direction="row" spacing={1.5} alignItems="center"><Box className="device-thumb">{d.images?.[0] ? <img src={imageSrc(d.images[0])} alt={`صورة ${d.name}`} /> : <LocalHospitalRounded />}</Box><Box><Typography component="button" className="device-name-link" onClick={() => navigate(`/devices/${d._id}`)} fontWeight={800} fontSize={13.5}>{d.name}</Typography><Typography variant="caption" color="text.secondary" display="block">{d.manufacturer} {d.model}</Typography><Typography sx={{ display: { xs: 'block', sm: 'none' }, fontFamily: 'monospace', fontSize: 10.5, color: 'text.secondary', mt: .35 }}>{d.serialNumber}</Typography></Box></Stack></TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><Typography fontFamily="monospace" fontSize={12.5}>{d.serialNumber}</Typography></TableCell><TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Typography fontSize={12.5}>{d.location || '—'}</Typography><Typography variant="caption" color="text.secondary">{d.accessories || 'بدون ملحقات'}</Typography></TableCell><TableCell><StatusChip status={d.status} /></TableCell><TableCell>{user.role !== 'viewer' && <IconButton className="action-icon" aria-label={`إجراءات ${d.name}`} size="small" onClick={(event) => setMenu({ anchor: event.currentTarget, device: d })}><MoreHorizRounded /></IconButton>}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}
      {!loading && devices.length === 0 && <Box className="device-empty-state"><Box className="device-empty-icon">{search || statusFilter ? <SearchRounded sx={{ fontSize: 34 }} /> : <Inventory2Rounded sx={{ fontSize: 34 }} />}</Box><Typography fontSize={17} fontWeight={800} mt={2}>{search || statusFilter ? 'لا توجد أجهزة مطابقة' : 'لا توجد أجهزة في المخزون بعد'}</Typography><Typography fontSize={13} color="text.secondary" mt={.6}>{search || statusFilter ? 'جرّب تغيير حالة الجهاز أو تعديل كلمات البحث لعرض نتائج أخرى.' : 'ابدأ بإضافة أول جهاز ليظهر هنا مع بياناته وحالته.'}</Typography>{(search || statusFilter) && <Button variant="outlined" sx={{ mt: 2.2 }} onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>مسح الفلاتر</Button>}</Box>}
      <Pager page={page} total={total} onChange={setPage} />
    </CardContent></Card>
    <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}><MenuItem onClick={() => { navigate(`/devices/${menu.device._id}`); setMenu(null); }}>عرض تفاصيل الجهاز</MenuItem><MenuItem onClick={() => { setEditing(menu.device); setOpen(true); setMenu(null); }}>تعديل الجهاز</MenuItem><MenuItem sx={{ color: 'error.main' }} onClick={() => { setDeleting(menu.device); setMenu(null); }}>حذف الجهاز</MenuItem></Menu>
    <DeviceDialog key={editing?._id || 'new'} device={editing} open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); setNotice(editing ? 'تم تعديل الجهاز بنجاح' : 'تمت إضافة الجهاز للمخزون بنجاح'); setEditing(null); setPage(1); load(); }} />
    <Dialog open={!!deleting} onClose={() => setDeleting(null)}><DialogTitle>حذف الجهاز؟</DialogTitle><DialogContent>سيختفي «{deleting?.name}» من المخزون مع الاحتفاظ بسجله في قاعدة البيانات.</DialogContent><DialogActions><Button onClick={() => setDeleting(null)}>إلغاء</Button><Button color="error" onClick={async () => { try { await api.deleteDevice(deleting._id); setDeleting(null); setNotice('تم حذف الجهاز'); load(); } catch (err) { setError(err.message); setDeleting(null); } }}>تأكيد الحذف</Button></DialogActions></Dialog>
    <Snackbar open={!!notice} autoHideDuration={3500} onClose={() => setNotice('')} message={notice} />
  </>;
}

function DeviceDialog({ open, onClose, onSaved, device }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [files, setFiles] = useState([]); const [removedImages, setRemovedImages] = useState([]);
  const clearFiles = () => { files.forEach((item) => URL.revokeObjectURL(item.url)); setFiles([]); };
  const close = () => { clearFiles(); setRemovedImages([]); setError(''); onClose(); };
  const addFiles = (event) => { const picked = Array.from(event.target.files || []); if (files.length + picked.length > 6) { setError('يمكن إضافة ٦ صور بحد أقصى في المرة الواحدة'); return; } setFiles((previous) => [...previous, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))]); event.target.value = ''; };
  const submit = async (e) => { e.preventDefault(); setSaving(true); setError(''); const fd = new FormData(e.currentTarget); files.forEach(({ file }) => fd.append('images', file)); try { if (device) { await api.updateDevice(device._id, fd); for (const imageId of removedImages) await api.deleteDeviceImage(device._id, imageId); } else await api.createDevice(fd); clearFiles(); onSaved(); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  return <Dialog open={open} onClose={close} fullWidth maxWidth="md"><Box component="form" onSubmit={submit}><DialogTitle><Stack direction="row" justifyContent="space-between" alignItems="center"><Box>{device ? 'تعديل الجهاز' : 'إضافة جهاز جديد'}<Typography fontSize={12} color="text.secondary" fontWeight={400}>بيانات الجهاز وصوره وملحقاته.</Typography></Box><IconButton aria-label="إغلاق" onClick={close}><CloseRounded /></IconButton></Stack></DialogTitle><DialogContent dividers>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, pt: 1 }}>
      <TextField name="name" label="اسم الجهاز" required defaultValue={device?.name || ''} /><TextField name="serialNumber" label="الرقم التسلسلي" required defaultValue={device?.serialNumber || ''} />
      <TextField name="manufacturer" label="الشركة المصنعة" defaultValue={device?.manufacturer || ''} /><TextField name="model" label="الموديل" defaultValue={device?.model || ''} />
      <TextField name="location" label="موقع التخزين" defaultValue={device?.location || 'المخزن الرئيسي'} /><TextField name="purchaseDate" label="تاريخ الشراء" type="date" defaultValue={device?.purchaseDate?.slice(0, 10) || ''} InputLabelProps={{ shrink: true }} />
      <FormControl><InputLabel>حالة المخزون</InputLabel><Select name="status" label="حالة المخزون" defaultValue={device?.status || 'available'} disabled={device?.status === 'rented'}><MenuItem value="available">متاح</MenuItem><MenuItem value="maintenance">في الصيانة</MenuItem><MenuItem value="reserved">محجوز</MenuItem>{device?.status === 'rented' && <MenuItem value="rented">مؤجّر</MenuItem>}</Select></FormControl>
      <FormControl><InputLabel>حالة الجهاز</InputLabel><Select name="condition" label="حالة الجهاز" defaultValue={device?.condition || 'excellent'}><MenuItem value="new">جديد</MenuItem><MenuItem value="excellent">ممتاز</MenuItem><MenuItem value="good">جيد</MenuItem><MenuItem value="fair">مقبول</MenuItem></Select></FormControl>
      <TextField name="accessories" label="ملحقات الجهاز" defaultValue={device?.accessories || ''} placeholder="مثال: شاحن، حقيبة، خرطوم" />
      <Button className="upload-zone" component="label" variant="outlined" startIcon={<AddRounded />}>إضافة صور الجهاز<input hidden type="file" accept="image/*" multiple onChange={addFiles} /></Button>
      <TextField name="notes" label="ملاحظات" multiline minRows={2} defaultValue={device?.notes || ''} sx={{ gridColumn: { sm: '1 / -1' } }} />
      {(files.length > 0 || device?.images?.length > 0) && <Box sx={{ gridColumn: { sm: '1 / -1' } }}><Typography fontWeight={700} fontSize={13} mb={1}>صور الجهاز</Typography><Stack direction="row" flexWrap="wrap" gap={1.5}>{device?.images?.filter((image) => !removedImages.includes(image.fileId)).map((image) => <Box className="image-preview" key={image.fileId}><img src={imageSrc(image)} alt="صورة الجهاز" /><IconButton size="small" aria-label="إزالة الصورة" onClick={() => setRemovedImages((items) => [...items, image.fileId])}><CloseRounded fontSize="small" /></IconButton></Box>)}{files.map((item) => <Box className="image-preview" key={item.url}><img src={item.url} alt={item.file.name} /><IconButton size="small" aria-label={`إزالة ${item.file.name}`} onClick={() => { URL.revokeObjectURL(item.url); setFiles((items) => items.filter((x) => x !== item)); }}><CloseRounded fontSize="small" /></IconButton></Box>)}</Stack></Box>}
    </Box>
  </DialogContent><DialogActions sx={{ p: 2.5 }}><Button onClick={close} color="inherit">إلغاء</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ الجهاز'}</Button></DialogActions></Box></Dialog>;
}

function DeviceDetails() {
  const { id } = useParams(); const navigate = useNavigate();
  const [device, setDevice] = useState(null); const [rentals, setRentals] = useState([]); const [movements, setMovements] = useState([]); const [rentalPage, setRentalPage] = useState(1); const [movementPage, setMovementPage] = useState(1); const [rentalTotal, setRentalTotal] = useState(0); const [movementTotal, setMovementTotal] = useState(0); const [selectedRental, setSelectedRental] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.device(id).then((result) => { if (result.device) setDevice(result.device); else setError('الجهاز غير موجود'); }).catch((err) => setError(err.message)); }, [id]);
  useEffect(() => { api.rentals({ device: id, page: rentalPage, sort: 'recent' }).then((result) => { setRentals(result.rentals); setRentalTotal(result.total); }).catch((err) => setError(err.message)); }, [id, rentalPage]);
  useEffect(() => { api.movements({ device: id, page: movementPage }).then((result) => { setMovements(result.movements); setMovementTotal(result.total); }).catch((err) => setError(err.message)); }, [id, movementPage]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!device) return <Loading />;
  return <>
    <PageHeader eyebrow="ملف الجهاز" title={device.name} subtitle={`الرقم التسلسلي: ${device.serialNumber}`} action={<Button variant="outlined" onClick={() => navigate('/devices')}>العودة للأجهزة</Button>} />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(280px,.65fr)' }, gap: 2.5, mb: 2.5 }}>
      <Card><CardContent sx={{ p: 3 }}><Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}><Typography variant="h6">بيانات الجهاز</Typography><StatusChip status={device.status} /></Stack><Box className="details-grid"><DetailItem label="الشركة المصنعة">{device.manufacturer}</DetailItem><DetailItem label="الموديل">{device.model}</DetailItem><DetailItem label="الموقع">{device.location}</DetailItem><DetailItem label="الملحقات">{device.accessories}</DetailItem><DetailItem label="تاريخ الشراء">{fmtDate(device.purchaseDate)}</DetailItem><DetailItem label="ملاحظات">{device.notes}</DetailItem></Box></CardContent></Card>
      <Card><CardContent sx={{ p: 3 }}><Typography variant="h6" mb={2}>صور الجهاز</Typography>{device.images?.length ? <Stack direction="row" flexWrap="wrap" gap={1.3}>{device.images.map((image) => <Box component="a" href={imageSrc(image)} target="_blank" rel="noreferrer" className="device-detail-image" key={image.fileId}><img src={imageSrc(image)} alt={device.name} /></Box>)}</Stack> : <Typography color="text.secondary" fontSize={13}>لم تُضف صور لهذا الجهاز.</Typography>}</CardContent></Card>
    </Box>
    <Card sx={{ mb: 2.5 }}><CardContent sx={{ p: { xs: 2, md: 3 } }}><Typography variant="h6" mb={.5}>تاريخ التأجير</Typography><Typography fontSize={12.5} color="text.secondary" mb={2}>كل عميل استلم الجهاز وفترة الإيجار الخاصة به.</Typography><TableContainer><Table><TableHead><TableRow><TableCell>العميل</TableCell><TableCell>من</TableCell><TableCell>إلى</TableCell><TableCell>الحالة</TableCell><TableCell>العقد</TableCell></TableRow></TableHead><TableBody>{rentals.map((r) => <TableRow key={r._id}><TableCell><Typography fontWeight={700} fontSize={13}>{r.customer?.name}</Typography><Typography variant="caption" color="text.secondary">{r.customer?.phone}</Typography></TableCell><TableCell>{fmtDate(r.startDate)}</TableCell><TableCell>{fmtDate(r.endDate)}</TableCell><TableCell><StatusChip status={r.status} /></TableCell><TableCell><Button size="small" onClick={() => setSelectedRental(r)}>التفاصيل</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>{rentals.length === 0 && <Box className="empty-state">لم يُؤجّر هذا الجهاز بعد.</Box>}<Pager page={rentalPage} total={rentalTotal} onChange={setRentalPage} /></CardContent></Card>
    <Card><CardContent sx={{ p: { xs: 2, md: 3 } }}><Typography variant="h6" mb={2}>سجل الجهاز</Typography><Stack spacing={1.2}>{movements.map((m) => <Box className="history-item" key={m._id}><Box><Typography fontWeight={800} fontSize={13.5}>{movementTypes[m.type] || m.type}</Typography><Typography fontSize={12.5} color="text.secondary">{m.details}</Typography></Box><Typography variant="caption" color="text.secondary">{fmtDate(m.createdAt)}</Typography></Box>)}</Stack>{movements.length === 0 && <Box className="empty-state">لا توجد حركة مسجلة لهذا الجهاز.</Box>}<Pager page={movementPage} total={movementTotal} onChange={setMovementPage} /></CardContent></Card>
    <RentalDetailsDialog rental={selectedRental} onClose={() => setSelectedRental(null)} />
  </>;
}

function Rentals({ user }) {
  const [rentals, setRentals] = useState([]); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('due'); const [rentedDate, setRentedDate] = useState(''); const [summary, setSummary] = useState(null); const [open, setOpen] = useState(false); const [selected, setSelected] = useState(null); const [returning, setReturning] = useState(null); const [notice, setNotice] = useState(''); const [error, setError] = useState('');
  const load = () => { api.rentals({ page, sort, date: rentedDate }).then((r) => { setRentals(r.rentals); setTotal(r.total); if (page > 1 && r.total <= (page - 1) * 10) setPage(Math.max(1, Math.ceil(r.total / 10))); }).catch((err) => setError(err.message)); api.dashboard().then(setSummary); };
  useEffect(() => { load(); }, [page, sort, rentedDate]);
  return <>
    <PageHeader eyebrow="دورة التأجير" title="عقود الإيجار" subtitle="تسليم، متابعة، تمديد واستلام الأجهزة." action={user.role !== 'viewer' && <Button variant="contained" startIcon={<SwapHorizRounded />} onClick={() => setOpen(true)}>تأجير جهاز</Button>} />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' }, gap: 2, mb: 2.5 }}><StatCard title="العقود النشطة" value={arNumber.format(summary?.counts.activeRentals || 0)} note="حاليًا لدى العملاء" icon={CalendarMonthRounded} /><StatCard title="متأخرة" value={arNumber.format(summary?.counts.overdue || 0)} note="تحتاج اتصالًا اليوم" icon={EventBusyRounded} tint="#B3261E" pale="#FFE2DE" /><StatCard title="قيمة التأمينات" value={money.format(summary?.financials.depositsHeld || 0)} note="للعقود النشطة" icon={ShieldRounded} tint="#4B63AA" pale="#E7EDFF" /></Box>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
    <Card><CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" mb={2.3}>
        <Typography fontWeight={700} fontSize={13}>ترتيب العقود</Typography>
        <Button variant={sort === 'due' ? 'contained' : 'outlined'} size="small" onClick={() => { setSort('due'); setPage(1); }}>الأقرب انتهاءً</Button>
        <Button variant={sort === 'recent' ? 'contained' : 'outlined'} size="small" onClick={() => { setSort('recent'); setPage(1); }}>الأحدث بتاريخ الإيجار</Button>
        <Box sx={{ flexGrow: 1 }} />
        <TextField type="date" label="تاريخ بداية الإيجار" value={rentedDate} onChange={(event) => { setRentedDate(event.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: { xs: '100%', sm: 220 } }} />
        {rentedDate && <Button size="small" onClick={() => { setRentedDate(''); setPage(1); }}>مسح التاريخ</Button>}
      </Stack>
      <Stack spacing={1.4}>{rentals.map((r) => <RentalAlert key={r._id} rental={r} onOpen={() => setSelected(r)} onReturn={user.role !== 'viewer' && ['active', 'overdue'].includes(r.status) ? setReturning : undefined} onExtend={user.role !== 'viewer' && ['active', 'overdue'].includes(r.status) ? async (x) => { try { const current = new Date(x.endDate); current.setDate(current.getDate() + 7); await api.extendRental(x._id, current.toISOString()); setNotice('تم تمديد العقد 7 أيام'); load(); } catch (err) { setError(err.message); } } : undefined} />)}</Stack>
      {!rentals.length && <Box className="empty-state">{rentedDate ? 'لا توجد أجهزة بدأ إيجارها في هذا اليوم.' : 'لا توجد عقود إيجار في هذا الترتيب.'}</Box>}
      <Pager page={page} total={total} onChange={setPage} />
    </CardContent></Card>
    <RentalDialog open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); setNotice('تم إنشاء عقد الإيجار وتغيير حالة الجهاز'); setPage(1); load(); }} />
    <RentalDetailsDialog rental={selected} onClose={() => setSelected(null)} />
    <ReturnDialog key={returning?._id || 'none'} rental={returning} onClose={() => setReturning(null)} onSaved={() => { setReturning(null); setNotice('تم تسجيل استلام الجهاز وملاحظاته'); load(); }} />
    <Snackbar open={!!notice} autoHideDuration={3500} onClose={() => setNotice('')} message={notice} />
  </>;
}

function ReturnDialog({ rental, onClose, onSaved }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSaving(true); setError('');
    try {
      await api.returnRental(rental._id, {
        conditionIn: String(values.get('conditionIn') || '').trim(),
        notes: String(values.get('notes') || '').trim(),
        needsMaintenance: values.has('needsMaintenance'),
      });
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };
  return <Dialog open={!!rental} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
    <Box component="form" onSubmit={submit}>
      <DialogTitle>استلام الجهاز</DialogTitle>
      <DialogContent dividers>
        <Typography fontWeight={800} mb={.3}>{rental?.device?.name}</Typography>
        <Typography color="text.secondary" fontSize={13} mb={2.5}>من العميل: {rental?.customer?.name}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2.2} pt={.5}>
          <TextField name="conditionIn" label="حالة الجهاز عند الاستلام" placeholder="مثال: سليم وكامل الملحقات" fullWidth />
          <TextField name="notes" label="ملاحظات الاستلام" placeholder="دوّن أي تلف أو ملحقات ناقصة أو تفاصيل مهمة" multiline minRows={3} inputProps={{ maxLength: 2000 }} fullWidth />
          <FormControlLabel control={<Checkbox name="needsMaintenance" color="primary" />} label="يحتاج صيانة — لا يظهر ضمن الأجهزة المتاحة للتأجير" />
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose} disabled={saving}>إلغاء</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'جارٍ تسجيل الاستلام...' : 'تأكيد الاستلام'}</Button></DialogActions>
    </Box>
  </Dialog>;
}

function DetailItem({ label, children }) {
  return <Box><Typography fontSize={11.5} color="text.secondary" mb={.4}>{label}</Typography><Typography fontSize={13.5} fontWeight={700}>{children || '—'}</Typography></Box>;
}

function RentalDetailsDialog({ rental, onClose }) {
  const navigate = useNavigate();
  return <Dialog open={!!rental} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle><Stack direction="row" alignItems="center" justifyContent="space-between">تفاصيل عقد الإيجار<IconButton onClick={onClose} aria-label="إغلاق"><CloseRounded /></IconButton></Stack></DialogTitle><DialogContent dividers>{rental && <><Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}><Box><Typography fontWeight={800} fontSize={17}>{rental.device?.name || 'جهاز محذوف'}</Typography><Typography variant="caption" color="text.secondary">{rental.device?.serialNumber}</Typography></Box><StatusChip status={rental.status} /></Stack><Box className="details-grid"><DetailItem label="اسم العميل">{rental.customer?.name}</DetailItem><DetailItem label="رقم الهاتف">{rental.customer?.phone}</DetailItem><DetailItem label="الرقم القومي">{rental.customer?.nationalId}</DetailItem><DetailItem label="العنوان">{rental.customer?.address}</DetailItem><DetailItem label="بداية الإيجار">{fmtDate(rental.startDate)}</DetailItem><DetailItem label="نهاية الإيجار">{fmtDate(rental.endDate)}</DetailItem><DetailItem label="سعر اليوم">{money.format(rental.dailyRate || 0)}</DetailItem><DetailItem label="التأمين">{money.format(rental.deposit || 0)}</DetailItem><DetailItem label="حالة التسليم">{rental.conditionOut}</DetailItem><DetailItem label="حالة الاستلام">{rental.conditionIn}</DetailItem><DetailItem label="تاريخ الاستلام">{fmtDate(rental.returnedAt)}</DetailItem><DetailItem label="ملاحظات العقد">{rental.notes}</DetailItem><DetailItem label="ملاحظات الاستلام">{rental.returnNotes}</DetailItem></Box></>}</DialogContent><DialogActions sx={{ p: 2.5 }}><Button onClick={onClose}>إغلاق</Button>{rental?.device?._id && <Button variant="contained" onClick={() => { const id = rental.device._id; onClose(); navigate(`/devices/${id}`); }}>عرض الجهاز وسجله</Button>}</DialogActions></Dialog>;
}

function RentalDialog({ open, onClose, onSaved }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null); const [deviceQuery, setDeviceQuery] = useState('');
  const [options, setOptions] = useState([]); const [searching, setSearching] = useState(false);
  const close = () => { setSelectedDevice(null); setDeviceQuery(''); setError(''); onClose(); };
  useEffect(() => {
    if (!open) return undefined;
    let active = true; setSearching(true);
    const timer = setTimeout(() => api.devices({ q: deviceQuery, status: 'available', page: 1, limit: 5 }).then((r) => { if (active) setOptions(r.devices); }).catch(() => { if (active) setOptions([]); }).finally(() => { if (active) setSearching(false); }), deviceQuery ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [open, deviceQuery]);
  const submit = async (e) => { e.preventDefault(); if (!selectedDevice) { setError('اختر جهازًا متاحًا من نتائج البحث'); return; } const fd = new FormData(e.currentTarget); const values = Object.fromEntries(fd.entries()); const data = { deviceId: selectedDevice._id, customer: { name: values.customerName, phone: values.phone, nationalId: values.nationalId, address: values.address }, startDate: values.startDate, endDate: values.endDate, dailyRate: values.dailyRate, deposit: values.deposit, conditionOut: values.conditionOut, notes: values.notes }; setSaving(true); try { await api.createRental(data); setSelectedDevice(null); setDeviceQuery(''); onSaved(); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10); const month = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return <Dialog open={open} onClose={close} fullWidth maxWidth="md"><Box component="form" onSubmit={submit}><DialogTitle>إنشاء عقد إيجار جديد</DialogTitle><DialogContent dividers>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
    <Autocomplete sx={{ gridColumn: { sm: '1 / -1' } }} options={options} value={selectedDevice} onChange={(_e, value) => setSelectedDevice(value)} inputValue={deviceQuery} onInputChange={(_e, value, reason) => { if (['input', 'clear', 'reset'].includes(reason)) setDeviceQuery(value); }} filterOptions={(items) => items} isOptionEqualToValue={(a, b) => a._id === b._id} getOptionLabel={(d) => `${d.name} — ${d.serialNumber}`} loading={searching} noOptionsText="لا توجد أجهزة متاحة مطابقة" loadingText="جارٍ البحث..." renderOption={(props, d) => <li {...props} key={d._id}><Box className="device-option"><Box className="device-thumb"><DevicesOtherRounded /></Box><Box><Typography fontWeight={800} fontSize={13}>{d.name}</Typography><Typography variant="caption" color="text.secondary" display="block">{d.serialNumber}</Typography></Box></Box></li>} renderInput={(params) => <TextField {...params} required label="ابحث عن جهاز متاح" placeholder="اسم الجهاز أو الرقم التسلسلي" InputProps={{ ...params.InputProps, startAdornment: <><SearchRounded sx={{ color: 'text.secondary', mx: 1 }} />{params.InputProps.startAdornment}</> }} />} />
    <TextField required name="customerName" label="اسم العميل" /><TextField required name="phone" label="رقم الهاتف" /><TextField name="nationalId" label="الرقم القومي" /><TextField name="address" label="العنوان" />
    <TextField required name="startDate" label="بداية الإيجار" type="date" defaultValue={tomorrow} InputLabelProps={{ shrink: true }} /><TextField required name="endDate" label="نهاية الإيجار" type="date" defaultValue={month} InputLabelProps={{ shrink: true }} />
    <TextField name="dailyRate" label="سعر اليوم" type="number" /><TextField name="deposit" label="قيمة التأمين" type="number" />
    <TextField name="conditionOut" label="حالة الجهاز عند التسليم" defaultValue="سليم وكامل الملحقات" /><TextField name="notes" label="ملاحظات العقد" />
  </Box></DialogContent><DialogActions sx={{ p: 2.5 }}><Button onClick={close} color="inherit">إلغاء</Button><Button type="submit" variant="contained" disabled={saving || !selectedDevice}>{saving ? 'جارٍ الحفظ...' : 'تأكيد التأجير'}</Button></DialogActions></Box></Dialog>;
}

function AlertsPage() {
  const [rentals, setRentals] = useState(null); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  useEffect(() => { api.rentals({ page, dueSoon: true }).then((r) => { setRentals(r.rentals); setTotal(r.total); }); }, [page]);
  if (!rentals) return <Loading />;
  return <><PageHeader eyebrow="المتابعة والاسترداد" title="تنبيهات انتهاء الإيجار" subtitle="رتّب اتصالات المتابعة حسب درجة الاستعجال." />
    <Alert severity="info" icon={<PhoneRounded />} sx={{ borderRadius: 4, mb: 2.5 }}>ننصح بالتواصل مع العميل قبل نهاية العقد بـ 3 أيام، وتوثيق أي تمديد داخل النظام.</Alert>
    <Card><CardContent sx={{ p: { xs: 1.5, md: 2.5 } }}><Stack spacing={1.4}>{rentals.map((r) => <RentalAlert key={r._id} rental={r} />)}</Stack>{rentals.length === 0 && <Box className="empty-state">لا توجد عقود تحتاج متابعة خلال 7 أيام.</Box>}<Pager page={page} total={total} onChange={setPage} /></CardContent></Card></>;
}

function Users({ currentUser }) {
  const [users, setUsers] = useState(null); const [page, setPage] = useState(1); const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false); const [deleting, setDeleting] = useState(null); const [notice, setNotice] = useState(''); const [error, setError] = useState(''); const load = () => api.users({ page }).then((r) => { setUsers(r.users); setTotal(r.total); if (page > 1 && r.total <= (page - 1) * 10) setPage(Math.max(1, Math.ceil(r.total / 10))); }); useEffect(() => { load(); }, [page]); if (!users) return <Loading />;
  return <><PageHeader eyebrow="التحكم والصلاحيات" title="المستخدمون" subtitle="أضف فريق العمل وحدد صلاحية كل مستخدم." action={<Button variant="contained" startIcon={<PersonAddAltRounded />} onClick={() => setOpen(true)}>إضافة مستخدم</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
    <Card><TableContainer><Table><TableHead><TableRow><TableCell>المستخدم</TableCell><TableCell>الصلاحية</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>آخر دخول</TableCell><TableCell>الحالة</TableCell><TableCell>إجراء</TableCell></TableRow></TableHead><TableBody>{users.map((u) => <TableRow key={u._id}><TableCell><Stack direction="row" spacing={1.5} alignItems="center"><Avatar sx={{ bgcolor: '#E5EDFF', color: 'primary.main', fontWeight: 800 }}>{u.name?.[0]}</Avatar><Box><Typography fontWeight={800} fontSize={13.5}>{u.name}</Typography><Typography variant="caption" color="text.secondary">{u.email}</Typography></Box></Stack></TableCell><TableCell>{roles[u.role]}</TableCell><TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{fmtDate(u.lastLoginAt)}</TableCell><TableCell><Chip size="small" label={u.active ? 'نشط' : 'موقوف'} color={u.active ? 'success' : 'default'} variant="outlined" /></TableCell><TableCell><Button size="small" color="error" disabled={u._id === currentUser._id} onClick={() => setDeleting(u)}>حذف</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer><Box sx={{ px: 3, pb: 3 }}><Pager page={page} total={total} onChange={setPage} /></Box></Card>
    <UserDialog open={open} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); setNotice('تمت إضافة المستخدم بنجاح'); load(); }} /><Snackbar open={!!notice} autoHideDuration={3500} onClose={() => setNotice('')} message={notice} />
    <Dialog open={!!deleting} onClose={() => setDeleting(null)}><DialogTitle>حذف المستخدم؟</DialogTitle><DialogContent>سيُمنع «{deleting?.name}» من الدخول، مع الاحتفاظ بسجله في قاعدة البيانات.</DialogContent><DialogActions><Button onClick={() => setDeleting(null)}>إلغاء</Button><Button color="error" onClick={async () => { try { await api.deleteUser(deleting._id); setDeleting(null); setNotice('تم حذف المستخدم'); load(); } catch (err) { setError(err.message); setDeleting(null); } }}>تأكيد الحذف</Button></DialogActions></Dialog>
  </>;
}

function Logs() {
  const [items, setItems] = useState(null); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [date, setDate] = useState(''); const [error, setError] = useState('');
  useEffect(() => { api.logs({ page, date }).then((r) => { setItems(r.logs); setTotal(r.total); setError(''); }).catch((err) => setError(err.message)); }, [page, date]);
  const actions = { create: 'إضافة', update: 'تعديل', delete: 'حذف', images_add: 'إضافة صور', image_delete: 'حذف صورة', return: 'استلام جهاز', extend: 'تمديد إيجار', overdue: 'تأخر العقد', created: 'إضافة', updated: 'تعديل', deleted: 'حذف', returned: 'استلام جهاز', extended: 'تمديد إيجار' };
  const entities = { device: 'جهاز', user: 'مستخدم', rental: 'عقد إيجار' };
  if (!items) return <Loading />;
  return <><PageHeader eyebrow="للمدير فقط" title="سجل التدقيق" subtitle="تاريخ التغييرات ومن نفذ كل إجراء داخل النظام." /><Stack direction="row" gap={1.3} alignItems="center" flexWrap="wrap" mb={2}><TextField label="اختر يومًا" type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} sx={{ width: 210 }} />{date && <Button onClick={() => { setDate(''); setPage(1); }}>عرض كل الأيام</Button>}</Stack>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Card><TableContainer><Table><TableHead><TableRow><TableCell>التاريخ</TableCell><TableCell>الإجراء</TableCell><TableCell>العنصر</TableCell><TableCell>بواسطة</TableCell></TableRow></TableHead><TableBody>{items.map((entry) => <TableRow key={entry._id}><TableCell>{new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</TableCell><TableCell>{actions[entry.action] || entry.action}</TableCell><TableCell>{entities[entry.entityType] || entry.entityType} · {entry.label || entry.entityId}</TableCell><TableCell>{entry.actorName || 'النظام'}<Typography variant="caption" display="block" color="text.secondary">{entry.actorEmail}</Typography></TableCell></TableRow>)}</TableBody></Table></TableContainer>{items.length === 0 && <Box className="empty-state">لا توجد تغييرات مسجلة {date ? 'في هذا اليوم' : 'بعد'}.</Box>}<Box sx={{ px: 3, pb: 3 }}><Pager page={page} total={total} limit={15} onChange={setPage} /></Box></Card></>;
}

function UserDialog({ open, onClose, onSaved }) {
  const [error, setError] = useState(''); const submit = async (e) => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget).entries()); try { await api.createUser(data); onSaved(); } catch (err) { setError(err.message); } };
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><Box component="form" onSubmit={submit}><DialogTitle>إضافة مستخدم</DialogTitle><DialogContent dividers><Stack spacing={2.2} pt={1}>{error && <Alert severity="error">{error}</Alert>}<TextField required name="name" label="الاسم بالكامل" /><TextField required name="email" type="email" label="البريد الإلكتروني" /><TextField required name="password" type="password" label="كلمة مرور مؤقتة" inputProps={{ minLength: 8 }} /><FormControl><InputLabel>الصلاحية</InputLabel><Select name="role" label="الصلاحية" defaultValue="storekeeper"><MenuItem value="admin">مدير النظام</MenuItem><MenuItem value="storekeeper">مسؤول مخزن</MenuItem><MenuItem value="viewer">مشاهدة فقط</MenuItem></Select></FormControl></Stack></DialogContent><DialogActions sx={{ p: 2.5 }}><Button onClick={onClose}>إلغاء</Button><Button type="submit" variant="contained">إضافة المستخدم</Button></DialogActions></Box></Dialog>;
}

export default function App() {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(!!localStorage.getItem('retal_token'));
  useEffect(() => { if (localStorage.getItem('retal_token')) api.me().then((r) => setUser(r.user)).catch(() => api.logout()).finally(() => setLoading(false)); }, []);
  if (loading) return <ThemeProvider theme={theme}><CssBaseline /><Loading /></ThemeProvider>;
  return <ThemeProvider theme={theme}><CssBaseline />{user ? <Shell user={user} onLogout={() => { api.logout(); setUser(null); }} /> : <Login onLogin={setUser} />}</ThemeProvider>;
}
