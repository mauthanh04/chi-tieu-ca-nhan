import express from 'express';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import categoriesRouter from './routes/categories';
import transactionsRouter from './routes/transactions';
import budgetsRouter from './routes/budgets';
import statisticsRouter from './routes/statistics';
import settingsRouter from './routes/settings';

dotenv.config();

const app = express();

app.use(express.json());

// CORS middleware for safety
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// REST API Routes with /api prefix
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/settings', settingsRouter);

// Duplicate mounts without /api prefix for Vercel rewrites flexibility
app.use('/auth', authRouter);
app.use('/accounts', accountsRouter);
app.use('/categories', categoriesRouter);
app.use('/transactions', transactionsRouter);
app.use('/budgets', budgetsRouter);
app.use('/statistics', statisticsRouter);
app.use('/settings', settingsRouter);

// Health check endpoint
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Fallback JSON 404 for missing API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Không tìm thấy API route yêu cầu' });
});

// Global error handler to ensure JSON response
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi hệ thống máy chủ',
  });
});

export default app;
