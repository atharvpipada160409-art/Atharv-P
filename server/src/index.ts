import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env';
import { initDb } from './db/db';
import { seedDemoData } from './db/seed';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import transactionRoutes from './routes/transaction.routes';
import forecastingRoutes from './routes/forecasting.routes';
import aiRoutes from './routes/ai.routes';
import settingsRoutes from './routes/settings.routes';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow Vite dev scripts & assets in dev
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    // Allow localhost and common dev origins
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin === config.clientOrigin) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev/testing environments
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', generalLimiter);

// Auth specific stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'CashFlowIQ Core Financial API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/forecasting', forecastingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);

// Static frontend serving if built
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('CashFlowIQ Backend is running. Please start the Vite frontend development server on port 5173.');
    }
  });
});

// Global 404 handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Global Exception]:', err);
  res.status(500).json({
    success: false,
    error: 'An internal server exception occurred.'
  });
});

// Initialize DB and start server
async function startServer() {
  try {
    await initDb();
    await seedDemoData();

    app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 CashFlowIQ Financial Engine active on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🤖 Gemini AI Model: gemini-2.5-flash`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[Fatal Startup Error]:', error);
    process.exit(1);
  }
}

startServer();

export default app;
