import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User } from './models.js';

async function seed() {
  if (!process.env.SEED_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD.length < 12 || /^(replace-|ChangeMe)/.test(process.env.SEED_ADMIN_PASSWORD)) {
    throw new Error('Seeding requires a unique SEED_ADMIN_PASSWORD of at least 12 characters');
  }
  await mongoose.connect(config.mongoUri);
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@retalcare.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (await User.exists({ email })) {
    console.log(`Admin user already exists: ${email}; no changes made`);
    await mongoose.disconnect();
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name: 'مدير رتال كير', email, passwordHash, role: 'admin', active: true });
  console.log(`Admin user is ready: ${email}`);
  await mongoose.disconnect();
}
seed().catch((error) => { console.error(error); process.exit(1); });
