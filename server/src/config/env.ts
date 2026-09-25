import dotenv from 'dotenv';
import path from 'path';

// Load .env from server dir or root dir
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cashflowiq',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-replace-in-production-cashflowiq-2025',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  sessionSecret: process.env.SESSION_SECRET || 'super-secret-session-key-cashflowiq-2025',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
