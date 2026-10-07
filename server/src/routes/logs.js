import { Router } from 'express';
import { allowRoles } from '../auth.js';
import { AuditLog } from '../models.js';
import { pagination } from '../pagination.js';

const router = Router();
router.use(allowRoles('admin'));
router.get('/', async (req, res) => {
  const { page, limit, skip } = pagination(req.query, 15);
  const filter = {};
  if (req.query.from || req.query.to) {
    const from = new Date(req.query.from); const to = new Date(req.query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) return res.status(400).json({ message: 'تاريخ البحث غير صحيح' });
    filter.createdAt = { $gte: from, $lt: to };
  }
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ logs, total, page, limit });
});
export default router;
