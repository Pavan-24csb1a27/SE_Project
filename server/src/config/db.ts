import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unihealth';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    console.error('[Database Error] Failed to connect to MongoDB:', error?.message || error);
    if (process.env.NODE_ENV === 'production') {
      console.log('[Database] Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection lost. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error] MongoDB runtime error:', err);
});
