import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { allowRoles } from '../auth.js';
import { User } from '../models.js';
import { pagination } from '../pagination.js';
import { recordAudit } from '../audit.js';

const router = Router();
router.use(allowRoles('admin'));
router.get('/', async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = { deletedAt: null };
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  res.json({ users, total, page, limit });
});
router.post('/', async (req, res) => {
  const { name, email, password, role = 'storekeeper' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'الاسم والبريد وكلمة المرور مطلوبة' });
  if (password.length < 8) return res.status(400).json({ message: 'كلمة المرور يجب ألا تقل عن 8 أحرف' });
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
  const user = await User.create({ name, email, role, passwordHash: await bcrypt.hash(password, 12) });
  await recordAudit({ user: req.user, action: 'create', entityType: 'user', entityId: user._id, label: user.name, details: { email: user.email, role: user.role } });
  res.status(201).json({ user });
});
router.patch('/:id', async (req, res) => {
  const allowed = Object.fromEntries(Object.entries(req.body).filter(([k]) => ['name', 'role', 'active'].includes(k)));
  const user = await User.findOne({ _id: req.params.id, deletedAt: null });
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
  const before = Object.fromEntries(Object.keys(allowed).map((key) => [key, user[key]]));
  Object.assign(user, allowed); await user.save();
  await recordAudit({ user: req.user, action: 'update', entityType: 'user', entityId: user._id, label: user.name, details: { changes: Object.fromEntries(Object.keys(allowed).map((key) => [key, { from: before[key], to: user[key] }])) } });
  res.json({ user });
});
router.delete('/:id', async (req, res) => {
  if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'لا يمكنك حذف حسابك الحالي' });
  const user = await User.findOne({ _id: req.params.id, deletedAt: null });
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
  if (user.role === 'admin' && await User.countDocuments({ role: 'admin', active: true, deletedAt: null }) <= 1) return res.status(409).json({ message: 'لا يمكن حذف آخر مدير للنظام' });
  user.deletedAt = new Date(); user.deletedBy = req.user._id; user.active = false; await user.save();
  await recordAudit({ user: req.user, action: 'delete', entityType: 'user', entityId: user._id, label: user.name, details: { email: user.email, role: user.role } });
  res.status(204).end();
});
export default router;
