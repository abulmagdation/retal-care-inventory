import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { allowRoles } from '../auth.js';
import { Device, Movement, Rental } from '../models.js';
import { pagination } from '../pagination.js';
import { recordAudit } from '../audit.js';

const router = Router();
export const imageRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
});

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'deviceImages' });
const uploadImage = (file) => new Promise((resolve, reject) => {
  const stream = bucket().openUploadStream(file.originalname, { contentType: file.mimetype, metadata: { purpose: 'device-image' } });
  stream.on('error', reject); stream.on('finish', () => resolve({ fileId: stream.id, filename: file.originalname, contentType: file.mimetype })); stream.end(file.buffer);
});

imageRouter.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
  const imageId = new mongoose.Types.ObjectId(req.params.id);
  const owner = await Device.exists({ archived: false, images: { $elemMatch: { fileId: imageId, deletedAt: null } } });
  if (!owner) return res.status(404).end();
  const files = await bucket().find({ _id: imageId }).toArray();
  if (!files[0]) return res.status(404).end();
  res.set('Content-Type', files[0].contentType || 'image/jpeg'); res.set('Cache-Control', 'public, max-age=86400');
  bucket().openDownloadStream(files[0]._id).on('error', () => res.status(404).end()).pipe(res);
});

router.get('/', async (req, res) => {
  const { q = '', status, category } = req.query;
  const { page, limit, skip } = pagination(req.query);
  const filter = { archived: false };
  if (status) filter.status = status; if (category) filter.category = category;
  if (q.trim()) { const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = ['name', 'serialNumber', 'category', 'manufacturer', 'model'].map((key) => ({ [key]: { $regex: escaped, $options: 'i' } })); }
  const [devices, total] = await Promise.all([Device.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Device.countDocuments(filter)]);
  res.json({ devices, total, page, limit });
});

router.get('/:id', async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, archived: false }); if (!device) return res.status(404).json({ message: 'الجهاز غير موجود' }); res.json({ device });
});

router.post('/', allowRoles('admin', 'storekeeper'), upload.array('images', 6), async (req, res) => {
  if (req.body.status && !['available', 'maintenance', 'reserved'].includes(req.body.status)) return res.status(400).json({ message: 'حالة الجهاز غير صحيحة' });
  const uploaded = [];
  try {
    for (const file of (req.files || [])) uploaded.push(await uploadImage(file));
    const device = await Device.create({
      name: req.body.name, serialNumber: req.body.serialNumber,
      manufacturer: req.body.manufacturer, model: req.body.model, location: req.body.location,
      condition: req.body.condition, purchaseDate: req.body.purchaseDate || undefined,
      notes: req.body.notes, accessories: req.body.accessories, status: req.body.status || 'available', images: uploaded,
    });
    await Movement.create({ device: device._id, type: 'added', toStatus: device.status, details: 'إضافة الجهاز للمخزون', performedBy: req.user._id });
    await recordAudit({ user: req.user, action: 'create', entityType: 'device', entityId: device._id, label: device.name, details: { serialNumber: device.serialNumber, imageCount: uploaded.length, accessories: device.accessories } });
    res.status(201).json({ device });
  } catch (error) {
    await Promise.all(uploaded.map((x) => bucket().delete(x.fileId).catch(() => {})));
    if (error.code === 11000) return res.status(409).json({ message: 'الرقم التسلسلي مسجل لجهاز آخر' }); throw error;
  }
});

router.patch('/:id', allowRoles('admin', 'storekeeper'), upload.array('images', 6), async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, archived: false }); if (!device) return res.status(404).json({ message: 'الجهاز غير موجود' });
  const before = device.toObject();
  const uploaded = [];
  try {
    const fromStatus = device.status;
    const fields = ['name', 'serialNumber', 'manufacturer', 'model', 'status', 'location', 'condition', 'purchaseDate', 'notes', 'accessories'];
    if (req.body.status === 'rented' && fromStatus !== 'rented') return res.status(409).json({ message: 'حالة مؤجّر تُحدد من عقد الإيجار فقط' });
    if (req.body.status && req.body.status !== 'rented' && await Rental.exists({ device: device._id, status: { $in: ['active', 'overdue'] } })) return res.status(409).json({ message: 'لا يمكن إتاحة جهاز مرتبط بعقد إيجار نشط' });
    for (const key of fields) if (req.body[key] !== undefined) device[key] = key === 'purchaseDate' && !req.body[key] ? null : req.body[key];
    for (const file of (req.files || [])) uploaded.push(await uploadImage(file));
    device.images.push(...uploaded);
    await device.save();
    const changes = Object.fromEntries(fields.filter((key) => req.body[key] !== undefined && String(before[key] ?? '') !== String(device[key] ?? '')).map((key) => [key, { from: before[key] ?? null, to: device[key] ?? null }]));
    const movementType = device.status === 'maintenance' && fromStatus !== device.status ? 'maintenance_in' : fromStatus === 'maintenance' && device.status === 'available' ? 'maintenance_out' : 'updated';
    await Movement.create({ device: device._id, type: movementType, fromStatus, toStatus: device.status, details: device.status !== fromStatus ? `تغيير الحالة من ${fromStatus} إلى ${device.status}` : 'تحديث بيانات الجهاز', performedBy: req.user._id });
    await recordAudit({ user: req.user, action: 'update', entityType: 'device', entityId: device._id, label: device.name, details: { changes, addedImages: uploaded.map((image) => image.filename) } });
    res.json({ device });
  } catch (error) {
    await Promise.all(uploaded.map((image) => bucket().delete(image.fileId).catch(() => {})));
    if (error.code === 11000) return res.status(409).json({ message: 'الرقم التسلسلي مسجل لجهاز آخر' });
    throw error;
  }
});

router.post('/:id/images', allowRoles('admin', 'storekeeper'), upload.array('images', 6), async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, archived: false }); if (!device) return res.status(404).json({ message: 'الجهاز غير موجود' });
  const images = []; for (const file of (req.files || [])) images.push(await uploadImage(file));
  device.images.push(...images); await device.save();
  await recordAudit({ user: req.user, action: 'images_add', entityType: 'device', entityId: device._id, label: device.name, details: { files: images.map((image) => image.filename) } });
  res.status(201).json({ device });
});

router.delete('/:id/images/:fileId', allowRoles('admin', 'storekeeper'), async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, archived: false }); if (!device) return res.status(404).json({ message: 'الجهاز غير موجود' });
  const image = device.images.find((x) => x.fileId.toString() === req.params.fileId && !x.deletedAt);
  if (!image) return res.status(404).json({ message: 'الصورة غير موجودة' });
  image.deletedAt = new Date(); await device.save();
  await recordAudit({ user: req.user, action: 'image_delete', entityType: 'device', entityId: device._id, label: device.name, details: { fileId: req.params.fileId, filename: image.filename } });
  res.status(204).end();
});

router.delete('/:id', allowRoles('admin', 'storekeeper'), async (req, res) => {
  const device = await Device.findOne({ _id: req.params.id, archived: false });
  if (!device) return res.status(404).json({ message: 'الجهاز غير موجود' });
  if (device.status === 'rented' || await Rental.exists({ device: device._id, status: { $in: ['active', 'overdue'] } })) return res.status(409).json({ message: 'استلم الجهاز أولًا قبل حذفه من المخزون' });
  device.archived = true; device.deletedAt = new Date(); device.deletedBy = req.user._id; await device.save();
  await recordAudit({ user: req.user, action: 'delete', entityType: 'device', entityId: device._id, label: device.name, details: { serialNumber: device.serialNumber } });
  res.status(204).end();
});
export default router;
