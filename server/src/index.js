import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { requireAuth } from './auth.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import devicesRouter, { imageRouter } from './routes/devices.js';
import rentalsRouter from './routes/rentals.js';
import { dashboardRouter, movementRouter } from './routes/reports.js';
import logsRouter from './routes/logs.js';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRouter);
// GridFS file IDs are unguessable. This read-only route stays public so browser image elements can render them.
app.use('/api/devices/images', imageRouter);
app.use('/api', requireAuth);
app.use('/api/users', usersRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/rentals', rentalsRouter);
app.use('/api/movements', movementRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/logs', logsRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('/{*path}', (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(clientDist, 'index.html')));

app.use((req, res) => res.status(404).json({ message: 'المسار المطلوب غير موجود' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'حجم الصورة أكبر من 5 ميجابايت' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: Object.values(error.errors).map((x) => x.message).join('، ') });
  res.status(500).json({ message: 'حدث خطأ غير متوقع في الخادم' });
});

async function start() {
  await mongoose.connect(config.mongoUri);
  app.listen(config.port, '0.0.0.0', () => console.log(`Retal Care API listening on port ${config.port}`));
}
start().catch((error) => { console.error('Failed to start server:', error.message); process.exit(1); });
