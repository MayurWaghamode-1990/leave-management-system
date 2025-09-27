import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { databaseService } from './services/databaseService';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import leaveRoutes from './routes/leaves';
import policyRoutes from './routes/policies';
import holidayRoutes from './routes/holidays';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import emailRoutes from './routes/email';
import monitoringRoutes from './routes/monitoring';
// import automationRulesRoutes from './routes/automationRules';
// import fileRoutes from './routes/files';
// import advancedLeavesRoutes from './routes/advancedLeaves';
import leaveTemplatesRoutes from './routes/leaveTemplates';
import lwpRoutes from './routes/lwp-simple';
import calendarRoutes from './routes/calendar';
import advancedReportsRoutes from './routes/advancedReports';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { authenticate } from './middleware/auth';

// Load environment variables
dotenv.config();
// Trigger restart

const app = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Create HTTP server and Socket.IO instance
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:5178',
      process.env.CORS_ORIGIN || 'http://localhost:5174'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Export io for use in other modules
export { io };

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// CORS configuration - MUST be before rate limiting
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    process.env.CORS_ORIGIN || 'http://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Basic security middleware
app.use(helmet());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic request logging and monitoring middleware (if available)
try {
  const { requestLogger, performanceMonitor, requestRateMonitor } = require('./middleware/requestLogger');
  app.use(requestLogger);
  app.use(performanceMonitor);
  app.use(requestRateMonitor);
} catch (error) {
  logger.warn('Request logging middleware not available, continuing without it');
}

// Input validation and sanitization (if available)
try {
  const { sanitizeInput, validateInputRate } = require('./middleware/inputSanitization');
  app.use(validateInputRate);
  app.use(sanitizeInput);
} catch (error) {
  logger.warn('Input sanitization middleware not available, continuing without it');
}

// Swagger API Documentation
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customSiteTitle: 'Leave Management System API',
  customfavIcon: '/favicon.ico',
  customCss: `
    .topbar-wrapper { display: none; }
    .swagger-ui .topbar { display: none; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

// Alternative docs route without /api/v1 prefix for convenience
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customSiteTitle: 'Leave Management System API',
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Leave Management System API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    documentation: {
      swagger: `http://localhost:${PORT}${API_PREFIX}/docs`,
      alternative: `http://localhost:${PORT}/docs`
    }
  });
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, authenticate, userRoutes);
app.use(`${API_PREFIX}/leaves`, authenticate, leaveRoutes);
app.use(`${API_PREFIX}/policies`, authenticate, policyRoutes);
app.use(`${API_PREFIX}/holidays`, authenticate, holidayRoutes);
app.use(`${API_PREFIX}/reports`, authenticate, reportRoutes);
app.use(`${API_PREFIX}/notifications`, authenticate, notificationRoutes);
app.use(`${API_PREFIX}/email`, authenticate, emailRoutes);
app.use(`${API_PREFIX}/monitoring`, monitoringRoutes);
// app.use(`${API_PREFIX}/automation-rules`, authenticate, automationRulesRoutes);
// app.use(`${API_PREFIX}/advanced-leaves`, advancedLeavesRoutes);
app.use(`${API_PREFIX}/templates`, authenticate, leaveTemplatesRoutes);
app.use(`${API_PREFIX}/lwp`, authenticate, lwpRoutes);
app.use(`${API_PREFIX}/calendar`, calendarRoutes);
app.use(`${API_PREFIX}/advanced-reports`, advancedReportsRoutes);
// app.use(`${API_PREFIX}/files`, fileRoutes);  // Temporarily disabled due to middleware issue

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);

  // Handle user authentication for real-time features
  socket.on('authenticate', (data) => {
    try {
      const { userId, role } = data;
      socket.join(`user:${userId}`);
      socket.join(`role:${role}`);
      logger.info(`👤 User ${userId} authenticated with role ${role}`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      logger.error('Socket authentication error:', error);
      socket.emit('authenticated', { success: false, error: 'Authentication failed' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  io.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  io.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Initialize database connection
    await databaseService.connect();

    server.listen(PORT, () => {
      logger.info(`🚀 Leave Management System API running on port ${PORT}`);
      logger.info(`📚 API documentation available at http://localhost:${PORT}${API_PREFIX}/docs`);
      logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
      logger.info(`🔌 WebSocket server ready for real-time notifications`);
      logger.info(`💾 Database connected and ready`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;