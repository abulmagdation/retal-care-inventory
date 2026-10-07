import { Router } from 'express';
import { allowRoles } from '../auth.js';
import { Device, Movement, Rental } from '../models.js';
import { pagination } from '../pagination.js';
import { recordAudit } from '../audit.js';

const router = Router();
async function markOverdue() {
  const due = await Rental.find({ status: 'active', endDate: { $lt: new Date() } }).populate('device', 'name');
  for (const rental of due) {
    const changed = await Rental.updateOne({ _id: rental._id, status: 'active' }, { status: 'overdue' });
    if (changed.modifiedCount) await recordAudit({ action: 'overdue', entityType: 'rental', entityId: rental._id, label: rental.device?.name || 'عقد إيجار', details: { endDate: rental.endDate } });
  }
}

router.get('/', async (req, res) => {
  await markOverdue();
  const { page, limit, skip } = pagination(req.query);
  const filter = req.query.status ? { status: req.query.status } : {};
  if (req.query.device) filter.device = req.query.device;
  if (req.query.rentedFrom || req.query.rentedTo) {
    const from = new Date(req.query.rentedFrom); const to = new Date(req.query.rentedTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) return res.status(400).json({ message: 'تاريخ الإيجار غير صحيح' });
    filter.startDate = { $gte: from, $lt: to };
  }
  if (req.query.sort === 'due' && !req.query.dueSoon && !filter.startDate) filter.status = { $in: ['active', 'overdue'] };
  if (req.query.dueSoon === 'true') {
    filter.status = { $in: ['active', 'overdue'] };
    filter.endDate = { $lte: new Date(Date.now() + 7 * 86400000) };
  }
  const [rentals, total] = await Promise.all([
    Rental.find(filter).populate('device').sort(req.query.sort === 'recent' ? { startDate: -1, _id: -1 } : { endDate: 1, _id: 1 }).skip(skip).limit(limit),
    Rental.countDocuments(filter),
  ]);
  res.json({ rentals, total, page, limit });
});

router.get('/alerts/count', async (_req, res) => {
  await markOverdue();
  const count = await Rental.countDocuments({ status: { $in: ['active', 'overdue'] }, endDate: { $lte: new Date(Date.now() + 7 * 86400000) } });
  res.json({ count });
});

router.post('/', allowRoles('admin', 'storekeeper'), async (req, res) => {
  const { deviceId, customer, startDate, endDate, dailyRate, deposit, conditionOut, notes } = req.body;
  if (!deviceId || !customer?.name || !customer?.phone || !startDate || !endDate) return res.status(400).json({ message: 'الجهاز والعميل وفترة الإيجار بيانات مطلوبة' });
  const start = new Date(startDate); const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return res.status(400).json({ message: 'تاريخ نهاية الإيجار يجب أن يكون بعد البداية' });
  const device = await Device.findOneAndUpdate({ _id: deviceId, status: 'available', archived: false }, { status: 'rented' }, { new: true });
  if (!device) return res.status(409).json({ message: 'الجهاز غير متاح للتأجير الآن' });
  try {
    const rental = await Rental.create({ device: deviceId, customer, startDate, endDate, dailyRate, deposit, conditionOut, notes, createdBy: req.user._id });
    await Movement.create({ device: deviceId, rental: rental._id, type: 'rented', fromStatus: 'available', toStatus: 'rented', details: `تسليم الجهاز للعميل ${customer.name}`, performedBy: req.user._id });
    await recordAudit({ user: req.user, action: 'create', entityType: 'rental', entityId: rental._id, label: device.name, details: { deviceId, serialNumber: device.serialNumber, customerName: customer.name, startDate, endDate } });
    res.status(201).json({ rental: await rental.populate('device') });
  } catch (error) { await Device.findByIdAndUpdate(deviceId, { status: 'available' }); throw error; }
});

router.post('/:id/return', allowRoles('admin', 'storekeeper'), async (req, res) => {
  const returnNotes = String(req.body.notes || '').trim();
  if (returnNotes.length > 2000) return res.status(400).json({ message: 'ملاحظات الاستلام طويلة جدًا' });
  const rental = await Rental.findOne({ _id: req.params.id, status: { $in: ['active', 'overdue'] } }).populate('device');
  if (!rental) return res.status(404).json({ message: 'عقد الإيجار النشط غير موجود' });
  rental.status = 'completed'; rental.returnedAt = new Date(); rental.conditionIn = String(req.body.conditionIn || '').trim(); rental.returnNotes = returnNotes; await rental.save();
  const needsMaintenance = req.body.needsMaintenance === true;
  await Device.findByIdAndUpdate(rental.device._id, { status: needsMaintenance ? 'maintenance' : 'available', condition: req.body.condition || rental.device.condition });
  await Movement.create({ device: rental.device._id, rental: rental._id, type: 'returned', fromStatus: 'rented', toStatus: needsMaintenance ? 'maintenance' : 'available', details: `استلام الجهاز من العميل ${rental.customer.name}${returnNotes ? ` — ${returnNotes}` : ''}`, performedBy: req.user._id });
  await recordAudit({ user: req.user, action: 'return', entityType: 'rental', entityId: rental._id, label: rental.device.name, details: { customerName: rental.customer.name, returnedAt: rental.returnedAt, conditionIn: rental.conditionIn, returnNotes, needsMaintenance } });
  res.json({ rental });
});

router.post('/:id/extend', allowRoles('admin', 'storekeeper'), async (req, res) => {
  const rental = await Rental.findOne({ _id: req.params.id, status: { $in: ['active', 'overdue'] } });
  if (!rental) return res.status(404).json({ message: 'عقد الإيجار النشط غير موجود' });
  const newEndDate = new Date(req.body.endDate);
  if (Number.isNaN(newEndDate.getTime()) || newEndDate <= rental.endDate) return res.status(400).json({ message: 'تاريخ التمديد يجب أن يكون بعد نهاية العقد الحالية' });
  const oldDate = rental.endDate; rental.endDate = req.body.endDate; rental.status = 'active'; await rental.save();
  await Movement.create({ device: rental.device, rental: rental._id, type: 'extended', details: `تمديد الإيجار من ${oldDate.toLocaleDateString('ar-EG')} إلى ${new Date(req.body.endDate).toLocaleDateString('ar-EG')}`, performedBy: req.user._id });
  await recordAudit({ user: req.user, action: 'extend', entityType: 'rental', entityId: rental._id, label: rental.customer.name, details: { oldEndDate: oldDate, newEndDate: rental.endDate } });
  res.json({ rental });
});
export { markOverdue };
export default router;
