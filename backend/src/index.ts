import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { appConfig } from '@config/config';
import { correlationIdMiddleware, ipAddressMiddleware, rateLimitMiddleware, globalRateLimiter } from '@middleware/auth';
import authRoutes from '@routes/auth';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: appConfig.cors.origin,
  credentials: appConfig.cors.credentials,
  optionsSuccessStatus: 200,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationIdMiddleware);
app.use(ipAddressMiddleware);
app.use(rateLimitMiddleware(globalRateLimiter));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    app: appConfig.app.name,
    version: appConfig.app.version,
  });
});

// Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    correlationId: req.correlationId,
  });
});

// Start server
const PORT = appConfig.server.port;
const HOST = appConfig.server.host;

app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  IT Credential Management App - Backend (v${appConfig.app.version})         ║
║  Server running at http://${HOST}:${PORT}                          ║
║  Environment: ${appConfig.app.environment}                            ║
║  Timezone: ${appConfig.app.timezone}                              ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
