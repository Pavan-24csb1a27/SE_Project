import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import availabilityRoutes from './routes/availability.routes';
import appointmentRoutes from './routes/appointment.routes';
import medicalRecordRoutes from './routes/medicalRecord.routes';
import prescriptionRoutes from './routes/prescription.routes';
import clinicalRoutes from './routes/clinical.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';

export const createServer = (): Application => {
  const app = express();

  // 1. Security Headers
  app.use(helmet());

  // 2. CORS configuration
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Body & Cookie Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 4. Request Logging (dev mode)
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 5. System Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'UniHealth API Gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // 6. Mount API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/availability', availabilityRoutes);
  app.use('/api/v1/appointments', appointmentRoutes);
  app.use('/api/v1/medical-records', medicalRecordRoutes);
  app.use('/api/v1/prescriptions', prescriptionRoutes);
  app.use('/api/v1/clinical', clinicalRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // 7. 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'API route not found',
    });
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
};
