import dotenv from 'dotenv';
dotenv.config();

import { createServer } from './server';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Express application
    const app = createServer();

    // 3. Start listening
    const server = app.listen(PORT, () => {
      console.log(`[UniHealth Server] Running on http://localhost:${PORT}`);
      console.log(`[UniHealth Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('\n[UniHealth Server] Received termination signal. Shutting down gracefully...');
      server.close(() => {
        console.log('[UniHealth Server] Closed out remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('[UniHealth Server] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
