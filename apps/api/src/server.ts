import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// ─── DB & Infrastructure ──────────────────────────────────────────────────
import connectDB from './config/database';
import connectRedis from './config/redis';
import connectElasticsearch from './config/elasticsearch';
import { getProducer, disconnectKafka } from './config/kafka';

// ─── Socket.IO ────────────────────────────────────────────────────────────
import { initSocketIO } from './sockets';

// ─── Routes ───────────────────────────────────────────────────────────────
import apiRouter from './routes';

// ─── Swagger ──────────────────────────────────────────────────────────────
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// ─── Middleware ───────────────────────────────────────────────────────────
import errorHandler from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// ─── Kafka Workers ────────────────────────────────────────────────────────
import { startItemUpdatesConsumer } from './workers/itemUpdates.consumer';
import { startAlertsConsumer } from './workers/alerts.consumer';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ─── Security ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}));

// ─── Rate limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message:  'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ─── Body parsing & compression ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

// ─── Swagger UI ───────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Beamup API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 + Error handling ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    await connectRedis();
    console.log('✅ Redis connected');

    await connectElasticsearch();
    console.log('✅ Elasticsearch connected');

    // Init Kafka producer (consumers start their own connections)
    await getProducer();
    console.log('✅ Kafka producer ready');

    // Start Kafka consumers (workers run alongside Express in same process)
    await startItemUpdatesConsumer();
    await startAlertsConsumer();

    // Create HTTP server (needed to share port between Express + Socket.IO)
    const httpServer = http.createServer(app);
    initSocketIO(httpServer);
    console.log('✅ Socket.IO initialized');

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`   REST API  → http://localhost:${PORT}/api`);
      console.log(`   Swagger   → http://localhost:${PORT}/api-docs`);
      console.log(`   Health    → http://localhost:${PORT}/health`);
      console.log(`   WebSocket → ws://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  await disconnectKafka();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

startServer();

export default app;
