import { demoDashboard, demoDevices, demoMovements, demoRentals, demoUsers } from './demoData';

const API_URL = import.meta.env.VITE_API_URL || '/api';
export const isDemo = String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === 'true';
const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), 280));
const changed = () => window.dispatchEvent(new Event('retal-data-changed'));
const pageResult = (items, key, page = 1, limit = 10) => wait({ [key]: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit });

let local = {
  devices: structuredClone(demoDevices), rentals: structuredClone(demoRentals),
  users: structuredClone(demoUsers), movements: structuredClone(demoMovements), logs: [],
};
const demoAudit = (action, entityType, item) => local.logs.unshift({ _id: `log-${Date.now()}-${Math.random()}`, action, entityType, entityId: item._id, label: item.name || item.email || item.customer?.name, actorName: demoUsers[0].name, actorEmail: demoUsers[0].email, createdAt: new Date().toISOString() });

function token() { return localStorage.getItem('retal_token'); }
async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || 'حدث خطأ في الاتصال بالخادم');
  return body;
}

export const api = {
  async login(email, password) {
    if (isDemo) {
      if (!email || password.length < 4) throw new Error('أدخل بريدًا وكلمة مرور صحيحة');
      localStorage.setItem('retal_token', 'demo-token');
      return wait({ token: 'demo-token', user: demoUsers[0] });
    }
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('retal_token', data.token);
    return data;
  },
  logout() { localStorage.removeItem('retal_token'); },
  me: () => isDemo ? wait({ user: demoUsers[0] }) : request('/auth/me'),
  dashboard: () => isDemo ? wait({
    ...demoDashboard,
    counts: {
      ...demoDashboard.counts,
      total: local.devices.filter((d) => !d.deletedAt).length,
      available: local.devices.filter((d) => !d.deletedAt && d.status === 'available').length,
      rented: local.devices.filter((d) => !d.deletedAt && d.status === 'rented').length,
      maintenance: local.devices.filter((d) => !d.deletedAt && d.status === 'maintenance').length,
      activeRentals: local.rentals.filter((r) => ['active', 'overdue'].includes(r.status)).length,
      overdue: local.rentals.filter((r) => ['active', 'overdue'].includes(r.status) && new Date(r.endDate) < new Date()).length,
    },
    financials: {
      ...demoDashboard.financials,
      depositsHeld: local.rentals.filter((r) => ['active', 'overdue'].includes(r.status)).reduce((sum, r) => sum + Number(r.deposit || 0), 0),
    },
    expiringSoon: local.rentals.filter((r) => ['active', 'overdue'].includes(r.status) && new Date(r.endDate) <= new Date(Date.now() + 7 * 86400000)).sort((a, b) => new Date(a.endDate) - new Date(b.endDate)),
  }) : request('/dashboard'),
  devices: ({ q = '', status = '', page = 1, limit = 10 } = {}) => isDemo
    ? pageResult(local.devices.filter((d) => !d.deletedAt && !d.archived && (!status || d.status === status) && `${d.name} ${d.serialNumber}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), 'devices', page, limit)
    : request(`/devices?${new URLSearchParams({ q, status, page, limit })}`),
  device: (id) => isDemo ? wait({ device: local.devices.find((d) => d._id === id && !d.deletedAt && !d.archived) || null }) : request(`/devices/${id}`),
  async createDevice(payload) {
    if (!isDemo) { const result = await request('/devices', { method: 'POST', body: payload }); changed(); return result; }
    const obj = Object.fromEntries(payload.entries()); delete obj.images;
    const device = { ...obj, images: Array.from(payload.getAll('images')).map((file) => ({ fileId: `demo-${Math.random()}`, previewUrl: URL.createObjectURL(file) })), _id: `d${Date.now()}`, status: obj.status || 'available', createdAt: new Date().toISOString() };
    local.devices.unshift(device); local.movements.unshift({ _id: `m-${Date.now()}`, device, type: 'added', details: 'إضافة الجهاز للمخزون', createdAt: new Date().toISOString() }); demoAudit('created', 'device', device); changed(); return wait({ device });
  },
  async updateDevice(id, payload) {
    if (!isDemo) { const result = await request(`/devices/${id}`, { method: 'PATCH', body: payload }); changed(); return result; }
    const device = local.devices.find((d) => d._id === id && !d.deletedAt);
    if (!device) throw new Error('الجهاز غير موجود');
    const values = Object.fromEntries(payload.entries()); delete values.images;
    if (device.status === 'rented' && values.status && values.status !== 'rented') throw new Error('استلم الجهاز أولًا قبل تغيير حالته');
    if (device.status !== 'rented' && values.status === 'rented') throw new Error('حالة مؤجّر تُحدد من عقد الإيجار فقط');
    const oldStatus = device.status; Object.assign(device, values);
    device.images = [...(device.images || []), ...Array.from(payload.getAll('images')).map((file) => ({ fileId: `demo-${Math.random()}`, previewUrl: URL.createObjectURL(file) }))];
    local.movements.unshift({ _id: `m-${Date.now()}`, device, type: oldStatus === 'maintenance' && device.status === 'available' ? 'maintenance_out' : device.status === 'maintenance' && oldStatus !== device.status ? 'maintenance_in' : 'updated', details: oldStatus !== device.status ? `تغيير الحالة من ${oldStatus} إلى ${device.status}` : 'تحديث بيانات الجهاز', createdAt: new Date().toISOString() });
    demoAudit('updated', 'device', device); changed(); return wait({ device });
  },
  async deleteDevice(id) {
    if (!isDemo) { const result = await request(`/devices/${id}`, { method: 'DELETE' }); changed(); return result; }
    const device = local.devices.find((d) => d._id === id);
    if (device.status === 'rented') throw new Error('لا يمكن حذف جهاز مؤجر');
    device.deletedAt = new Date().toISOString(); demoAudit('deleted', 'device', device); changed(); return wait({ ok: true });
  },
  async deleteDeviceImage(id, imageId) {
    if (!isDemo) { const result = await request(`/devices/${id}/images/${imageId}`, { method: 'DELETE' }); changed(); return result; }
    const device = local.devices.find((d) => d._id === id);
    device.images = (device.images || []).filter((image) => image.fileId !== imageId);
    demoAudit('image_deleted', 'device', device); changed(); return wait({ ok: true });
  },
  rentals: ({ page = 1, limit = 10, dueSoon = false, sort = '', device = '', date = '' } = {}) => {
    const start = date ? new Date(`${date}T00:00:00`) : null;
    const end = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) : null;
    return isDemo
      ? pageResult(local.rentals.filter((r) => (!device || r.device?._id === device) && (sort !== 'due' || !!start || ['active', 'overdue'].includes(r.status)) && (!start || (new Date(r.startDate) >= start && new Date(r.startDate) < end)) && (!dueSoon || (['active', 'overdue'].includes(r.status) && new Date(r.endDate) <= new Date(Date.now() + 7 * 86400000)))).sort((a, b) => sort === 'recent' ? new Date(b.startDate) - new Date(a.startDate) : new Date(a.endDate) - new Date(b.endDate)), 'rentals', page, limit)
      : request(`/rentals?${new URLSearchParams({ page, limit, dueSoon, sort, device, ...(start ? { rentedFrom: start.toISOString(), rentedTo: end.toISOString() } : {}) })}`);
  },
  alertsCount: () => isDemo
    ? wait({ count: local.rentals.filter((r) => ['active', 'overdue'].includes(r.status) && new Date(r.endDate) <= new Date(Date.now() + 7 * 86400000)).length })
    : request('/rentals/alerts/count'),
  async createRental(data) {
    if (!isDemo) { const result = await request('/rentals', { method: 'POST', body: JSON.stringify(data) }); changed(); return result; }
    const device = local.devices.find((d) => d._id === data.deviceId && !d.deletedAt);
    if (!device || device.status !== 'available') throw new Error('الجهاز غير متاح للتأجير');
    device.status = 'rented';
    const rental = { ...data, _id: `r${Date.now()}`, device, status: 'active' }; local.rentals.unshift(rental); local.movements.unshift({ _id: `m-${Date.now()}`, device, rental: rental._id, type: 'rented', details: `تسليم الجهاز للعميل ${data.customer.name}`, createdAt: new Date().toISOString() }); changed();
    demoAudit('created', 'rental', rental);
    return wait({ rental });
  },
  async returnRental(id, data = {}) {
    if (!isDemo) { const result = await request(`/rentals/${id}/return`, { method: 'POST', body: JSON.stringify(data) }); changed(); return result; }
    const rental = local.rentals.find((r) => r._id === id); rental.status = 'completed'; rental.returnedAt = new Date().toISOString(); rental.conditionIn = data.conditionIn || ''; rental.returnNotes = data.notes || ''; rental.device.status = data.needsMaintenance ? 'maintenance' : 'available'; const device = local.devices.find((d) => d._id === rental.device._id); if (device) device.status = rental.device.status; local.movements.unshift({ _id: `m-${Date.now()}`, device: device || rental.device, rental: id, type: 'returned', details: `استلام الجهاز من العميل ${rental.customer.name}${rental.returnNotes ? ` — ${rental.returnNotes}` : ''}`, createdAt: new Date().toISOString() }); demoAudit('returned', 'rental', rental); changed(); return wait({ rental });
  },
  async extendRental(id, endDate) {
    if (!isDemo) { const result = await request(`/rentals/${id}/extend`, { method: 'POST', body: JSON.stringify({ endDate }) }); changed(); return result; }
    const rental = local.rentals.find((r) => r._id === id); rental.endDate = endDate; rental.status = 'active'; local.movements.unshift({ _id: `m-${Date.now()}`, device: rental.device, rental: id, type: 'extended', details: `تمديد الإيجار حتى ${new Date(endDate).toLocaleDateString('ar-EG')}`, createdAt: new Date().toISOString() }); demoAudit('extended', 'rental', rental); changed(); return wait({ rental });
  },
  users: ({ page = 1, limit = 10 } = {}) => isDemo ? pageResult(local.users.filter((u) => !u.deletedAt), 'users', page, limit) : request(`/users?${new URLSearchParams({ page, limit })}`),
  async createUser(data) {
    if (!isDemo) { const result = await request('/users', { method: 'POST', body: JSON.stringify(data) }); changed(); return result; }
    const user = { ...data, _id: `u${Date.now()}`, active: true }; delete user.password; local.users.unshift(user); demoAudit('created', 'user', user); changed(); return wait({ user });
  },
  async deleteUser(id) {
    if (!isDemo) { const result = await request(`/users/${id}`, { method: 'DELETE' }); changed(); return result; }
    const user = local.users.find((u) => u._id === id);
    if (user._id === demoUsers[0]._id) throw new Error('لا يمكنك حذف حسابك الحالي');
    user.deletedAt = new Date().toISOString(); demoAudit('deleted', 'user', user); changed(); return wait({ ok: true });
  },
  logs: ({ page = 1, limit = 15, date = '' } = {}) => {
    const start = date ? new Date(`${date}T00:00:00`) : null;
    const end = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) : null;
    return isDemo ? pageResult(local.logs.filter((entry) => !start || (new Date(entry.createdAt) >= start && new Date(entry.createdAt) < end)), 'logs', page, limit) : request(`/logs?${new URLSearchParams({ page, limit, ...(start ? { from: start.toISOString(), to: end.toISOString() } : {}) })}`);
  },
  movements: ({ page = 1, limit = 10, device = '' } = {}) => isDemo ? pageResult(local.movements.filter((m) => !device || m.device?._id === device), 'movements', page, limit) : request(`/movements?${new URLSearchParams({ page, limit, device })}`),
};
