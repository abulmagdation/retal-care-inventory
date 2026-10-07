import { Router } from 'express';
import { Device, Movement, Rental } from '../models.js';
import { markOverdue } from './rentals.js';
import { pagination } from '../pagination.js';

export const movementRouter = Router();
movementRouter.get('/', async (req, res) => {
  const filter = req.query.device ? { device: req.query.device } : {};
  const { page, limit, skip } = pagination(req.query);
  const [movements, total] = await Promise.all([
    Movement.find(filter).select('-performedBy').populate('device', 'name serialNumber').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Movement.countDocuments(filter),
  ]);
  res.json({ movements, total, page, limit });
});

export const dashboardRouter = Router();
dashboardRouter.get('/', async (_req, res) => {
  await markOverdue();
  const now = new Date(); const soon = new Date(Date.now() + 7 * 86400000);
  const [statusCounts, overdue, expiringSoon, recentMovements, byCategory, activeRentals] = await Promise.all([
    Device.aggregate([{ $match: { archived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Rental.countDocuments({ status: 'overdue' }),
    Rental.find({ status: { $in: ['active', 'overdue'] }, endDate: { $lte: soon } }).populate('device').sort({ endDate: 1 }).limit(8),
    Movement.find().select('-performedBy').populate('device', 'name serialNumber').sort({ createdAt: -1 }).limit(8),
    Device.aggregate([{ $match: { archived: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Rental.find({ status: { $in: ['active', 'overdue'] } }),
  ]);
  const map = Object.fromEntries(statusCounts.map((x) => [x._id, x.count])); const total = statusCounts.reduce((a, x) => a + x.count, 0);
  const activeRentalValue = activeRentals.reduce((sum, r) => sum + Math.ceil((r.endDate - r.startDate) / 86400000) * r.dailyRate, 0);
  res.json({ counts: { total, available: map.available || 0, rented: map.rented || 0, maintenance: map.maintenance || 0, reserved: map.reserved || 0, overdue, activeRentals: activeRentals.length }, financials: { activeRentalValue, depositsHeld: activeRentals.reduce((a, r) => a + r.deposit, 0) }, expiringSoon, recentMovements, byCategory, generatedAt: now });
});
