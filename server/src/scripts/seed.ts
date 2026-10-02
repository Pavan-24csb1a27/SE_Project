import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { autoSeedDemoData } from '../services/seed.service';

const runSeed = async () => {
  try {
    await connectDB();
    await autoSeedDemoData();
    console.log('[Seed Script] Seeding operation completed successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Script] Seeding failed:', error);
    process.exit(1);
  }
};

runSeed();
