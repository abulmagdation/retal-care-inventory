import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models.js';
import { requireAuth, signToken } from '../auth.js';

const router = Router();
const safeUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, active: u.active, lastLoginAt: u.lastLoginAt });

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'البريد وكلمة المرور مطلوبان' });
  const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+passwordHash');
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  user.lastLoginAt = new Date(); await user.save();
  res.json({ token: signToken(user), user: safeUser(user) });
});
router.get('/me', requireAuth, (req, res) => res.json({ user: safeUser(req.user) }));
export default router;
