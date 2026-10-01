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

  // 1. Security Headers (allow cross-origin assets for reports/downloads)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // 2. CORS configuration
  const configuredClientUrl = process.env.CLIENT_URL;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow server-to-server, curl, Postman or health checks without origin
        if (!origin) return callback(null, true);
        if (
          origin === configuredClientUrl ||
          origin === 'http://localhost:5173' ||
          origin === 'http://localhost:3000' ||
          origin.endsWith('.vercel.app')
        ) {
          return callback(null, true);
        }
        // Permissive fallback so dynamically deployed Vercel previews connect smoothly
        return callback(null, true);
      },
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
