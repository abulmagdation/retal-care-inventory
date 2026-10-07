import 'dotenv/config';

const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /^(replace-|development-only)/.test(process.env.JWT_SECRET))) {
  throw new Error('Production requires MONGODB_URI and a unique JWT_SECRET of at least 32 characters');
}

export const config = {
  port: Number(process.env.PORT || (production ? 8080 : 5000)),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retal_care',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  clientUrl: process.env.CLIENT_URL || (production ? false : 'http://localhost:5173'),
};
