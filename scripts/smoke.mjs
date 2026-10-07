import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Device, Rental, AuditLog } from '../server/src/models.js';

const databaseName = `retal_care_smoke_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
const mongoUri = `mongodb://127.0.0.1:27017/${databaseName}`;
const productionSmoke = process.env.SMOKE_PRODUCTION === 'true';
let server;
let createdDatabase = false;
let serverOutput = '';

const check = (label, assertion) => { assertion(); console.log(`✓ ${label}`); };
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  const listener = createServer();
  await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

async function run() {
  if (productionSmoke) assert.ok(existsSync(new URL('../client/dist/index.html', import.meta.url)), 'Build the client before the production smoke test');
  assert.match(databaseName, /^retal_care_smoke_\d+_\d+$/);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  assert.equal(mongoose.connection.name, databaseName);
  createdDatabase = true;
  await User.create({ name: 'مدير الاختبار', email: 'smoke-admin@retal.test', passwordHash: await bcrypt.hash('SmokePass123!', 10), role: 'admin' });
  await mongoose.disconnect();

  const port = await freePort();
  const base = `http://127.0.0.1:${port}/api`;
  server = spawn(process.execPath, ['server/src/index.js'], {
    cwd: new URL('..', import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (match) => match.slice(1)),
    env: { ...process.env, NODE_ENV: productionSmoke ? 'production' : 'test', MONGODB_URI: mongoUri, PORT: String(port), JWT_SECRET: 'smoke-test-secret-only-1234567890-long', CLIENT_URL: 'http://localhost:5173' },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  server.stdout.on('data', (chunk) => { serverOutput = (serverOutput + chunk.toString()).slice(-4000); });
  server.stderr.on('data', (chunk) => { serverOutput = (serverOutput + chunk.toString()).slice(-4000); });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${serverOutput}`);
    try { const response = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break; } } catch { /* wait for startup */ }
    await delay(200);
  }
  if (!ready) throw new Error(`Test server did not start: ${serverOutput}`);

  if (productionSmoke) {
    const home = await fetch(`http://127.0.0.1:${port}/`);
    const html = await home.text();
    check('production frontend served', () => { assert.equal(home.status, 200); assert.match(html, /<html/); });
    const deepLink = await fetch(`http://127.0.0.1:${port}/devices/example`);
    check('production SPA route served', () => assert.equal(deepLink.status, 200));
    const assetPath = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
    assert.ok(assetPath, 'Built JavaScript asset not found in HTML');
    const asset = await fetch(`http://127.0.0.1:${port}${assetPath}`);
    const bundle = await asset.text();
    check('production bundle uses same-origin API', () => { assert.equal(asset.status, 200); assert.ok(!bundle.includes('http://localhost:5000/api')); });
  }

  async function request(path, { method = 'GET', token, body } = {}) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${base}${path}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    return { status: response.status, data };
  }

  const invalidLogin = await request('/auth/login', { method: 'POST', body: { email: 'smoke-admin@retal.test', password: 'wrong' } });
  check('invalid login rejected', () => assert.equal(invalidLogin.status, 401));
  const login = await request('/auth/login', { method: 'POST', body: { email: 'smoke-admin@retal.test', password: 'SmokePass123!' } });
  check('admin login and session', () => { assert.equal(login.status, 200); assert.ok(login.data.token); });
  const token = login.data.token;

  const createdUser = await request('/users', { method: 'POST', token, body: { name: 'مشاهد الاختبار', email: 'smoke-viewer@retal.test', password: 'ViewerPass123!', role: 'viewer' } });
  check('user creation', () => assert.equal(createdUser.status, 201));
  const viewerLogin = await request('/auth/login', { method: 'POST', body: { email: 'smoke-viewer@retal.test', password: 'ViewerPass123!' } });
  const forbiddenLogs = await request('/logs', { token: viewerLogin.data.token });
  check('logs restricted to admin', () => assert.equal(forbiddenLogs.status, 403));

  const form = new FormData();
  for (const [key, value] of Object.entries({ name: 'جهاز اختبار', serialNumber: 'SMOKE-001', status: 'available', accessories: 'حقيبة وشاحن' })) form.append(key, value);
  form.append('images', new Blob(['smoke image bytes'], { type: 'image/png' }), 'smoke.png');
  const createdDevice = await request('/devices', { method: 'POST', token, body: form });
  check('device creation with MongoDB image', () => { assert.equal(createdDevice.status, 201); assert.equal(createdDevice.data.device.images.length, 1); });
  const deviceId = createdDevice.data.device._id;
  const imageId = createdDevice.data.device.images[0].fileId;
  const image = await fetch(`${base}/devices/images/${imageId}`);
  check('device image served', () => assert.equal(image.status, 200));
  await image.arrayBuffer();

  const search = await request('/devices?q=SMOKE-001&status=available&limit=5', { token });
  check('device search and status filter', () => { assert.equal(search.data.total, 1); assert.equal(search.data.devices[0]._id, deviceId); });
  const maintenanceForm = new FormData(); maintenanceForm.append('status', 'maintenance');
  const maintenance = await request(`/devices/${deviceId}`, { method: 'PATCH', token, body: maintenanceForm });
  check('device status change to maintenance', () => assert.equal(maintenance.data.device.status, 'maintenance'));
  const availableForm = new FormData(); availableForm.append('status', 'available');
  const available = await request(`/devices/${deviceId}`, { method: 'PATCH', token, body: availableForm });
  check('device status change back to available', () => assert.equal(available.data.device.status, 'available'));

  const startDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  const rentalBody = { deviceId, customer: { name: 'عميل الاختبار', phone: '01000000000' }, startDate, endDate, notes: 'ملاحظات العقد الأصلية' };
  const invalidRentalDate = await request('/rentals', { method: 'POST', token, body: { ...rentalBody, endDate: 'not-a-date' } });
  check('invalid rental date rejected', () => assert.equal(invalidRentalDate.status, 400));
  const rented = await request('/rentals', { method: 'POST', token, body: rentalBody });
  check('rental creation', () => assert.equal(rented.status, 201));
  const rentalId = rented.data.rental._id;
  const doubleRent = await request('/rentals', { method: 'POST', token, body: rentalBody });
  check('double rental blocked', () => assert.equal(doubleRent.status, 409));
  const rentedSearch = await request('/devices?status=available&q=SMOKE-001', { token });
  check('rented device excluded from available search', () => assert.equal(rentedSearch.data.total, 0));
  const invalidStatus = await request(`/devices/${deviceId}`, { method: 'PATCH', token, body: availableForm });
  check('active rental blocks status override', () => assert.equal(invalidStatus.status, 409));

  const from = new Date(`${startDate}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 86_400_000);
  const dateQuery = new URLSearchParams({ sort: 'due', rentedFrom: from.toISOString(), rentedTo: to.toISOString() });
  const rentalsByDay = await request(`/rentals?${dateQuery}`, { token });
  check('rental date filter', () => { assert.equal(rentalsByDay.data.total, 1); assert.equal(rentalsByDay.data.rentals[0]._id, rentalId); });
  const invalidExtension = await request(`/rentals/${rentalId}/extend`, { method: 'POST', token, body: { endDate: 'not-a-date' } });
  check('invalid extension date rejected', () => assert.equal(invalidExtension.status, 400));
  const extendedDate = new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10);
  const extended = await request(`/rentals/${rentalId}/extend`, { method: 'POST', token, body: { endDate: extendedDate } });
  check('rental extension', () => { assert.equal(extended.status, 200); assert.equal(extended.data.rental.endDate.slice(0, 10), extendedDate); });
  const alerts = await request('/rentals/alerts/count', { token });
  check('alerts count', () => assert.equal(alerts.data.count, 1));

  const returned = await request(`/rentals/${rentalId}/return`, { method: 'POST', token, body: { conditionIn: 'يوجد خدش بسيط', notes: 'الشاحن ناقص', needsMaintenance: true } });
  check('return notes saved separately from contract notes', () => {
    assert.equal(returned.status, 200);
    assert.equal(returned.data.rental.status, 'completed');
    assert.equal(returned.data.rental.notes, 'ملاحظات العقد الأصلية');
    assert.equal(returned.data.rental.returnNotes, 'الشاحن ناقص');
    assert.equal(returned.data.rental.conditionIn, 'يوجد خدش بسيط');
  });
  const afterReturn = await request(`/devices/${deviceId}`, { token });
  check('return sends device to maintenance', () => assert.equal(afterReturn.data.device.status, 'maintenance'));
  const repeatReturn = await request(`/rentals/${rentalId}/return`, { method: 'POST', token, body: {} });
  check('duplicate return blocked', () => assert.equal(repeatReturn.status, 404));
  const history = await request(`/movements?device=${deviceId}`, { token });
  check('device movement history includes return note', () => assert.ok(history.data.movements.some((entry) => entry.details.includes('الشاحن ناقص'))));

  const deletedImage = await request(`/devices/${deviceId}/images/${imageId}`, { method: 'DELETE', token });
  check('image soft deletion', () => assert.equal(deletedImage.status, 204));
  const hiddenImage = await fetch(`${base}/devices/images/${imageId}`);
  check('soft-deleted image no longer served', () => assert.equal(hiddenImage.status, 404));

  const deletedUser = await request(`/users/${createdUser.data.user._id}`, { method: 'DELETE', token });
  check('user soft deletion', () => assert.equal(deletedUser.status, 204));
  const blockedLogin = await request('/auth/login', { method: 'POST', body: { email: 'smoke-viewer@retal.test', password: 'ViewerPass123!' } });
  check('deleted user cannot log in', () => assert.equal(blockedLogin.status, 401));
  const users = await request('/users', { token });
  check('deleted user absent from listing', () => assert.equal(users.data.total, 1));

  const readyForm = new FormData(); readyForm.append('status', 'available');
  await request(`/devices/${deviceId}`, { method: 'PATCH', token, body: readyForm });
  const deletedDevice = await request(`/devices/${deviceId}`, { method: 'DELETE', token });
  check('device soft deletion', () => assert.equal(deletedDevice.status, 204));
  const hiddenDevice = await request(`/devices/${deviceId}`, { token });
  check('deleted device hidden from detail', () => assert.equal(hiddenDevice.status, 404));

  const logs = await request('/logs', { token });
  check('audit trail created', () => assert.ok(logs.data.total >= 8));
  const logDate = new Date().toISOString().slice(0, 10);
  const auditStart = new Date(`${logDate}T00:00:00.000Z`);
  const auditEnd = new Date(auditStart.getTime() + 86_400_000);
  const dayLogs = await request(`/logs?${new URLSearchParams({ from: auditStart.toISOString(), to: auditEnd.toISOString() })}`, { token });
  check('audit date filter', () => { assert.equal(dayLogs.status, 200); assert.ok(dayLogs.data.total >= 8); });
  const dashboard = await request('/dashboard', { token });
  check('dashboard reflects deleted device', () => assert.equal(dashboard.data.counts.total, 0));

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const persistedDevice = await Device.findById(deviceId).lean();
  const persistedRental = await Rental.findById(rentalId).lean();
  const storedImage = await mongoose.connection.db.collection('deviceImages.files').findOne({ _id: new mongoose.Types.ObjectId(imageId) });
  const auditCount = await AuditLog.countDocuments({ action: 'return', entityId: rentalId });
  check('soft-deleted records and image retained in MongoDB', () => { assert.ok(persistedDevice.archived); assert.ok(persistedDevice.images[0].deletedAt); assert.ok(storedImage); assert.equal(persistedRental.returnNotes, 'الشاحن ناقص'); assert.equal(auditCount, 1); });
  await mongoose.disconnect();
}

try {
  await run();
  console.log('All smoke checks passed.');
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) server.kill();
  if (mongoose.connection.readyState) await mongoose.disconnect();
  if (createdDatabase) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    if (mongoose.connection.name !== databaseName || !databaseName.startsWith('retal_care_smoke_')) throw new Error('Refusing to clean up an unexpected database');
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log(`Removed isolated test database: ${databaseName}`);
  }
}
