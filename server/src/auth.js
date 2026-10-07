import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { User } from './models.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export async function requireAuth(req, res, next) {
  try {
    const raw = req.headers.authorization;
    if (!raw?.startsWith('Bearer ')) return res.status(401).json({ message: 'يجب تسجيل الدخول أولًا' });
    const payload = jwt.verify(raw.slice(7), config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user || !user.active || user.deletedAt) return res.status(401).json({ message: 'هذا الحساب غير متاح' });
    req.user = user; next();
  } catch { return res.status(401).json({ message: 'انتهت جلسة الدخول، سجّل الدخول مرة أخرى' }); }
}

export const allowRoles = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'ليس لديك صلاحية لتنفيذ هذا الإجراء' });
