import { Router } from 'express';
import {
  uploadReport,
  getReports,
  downloadReport,
} from '../controllers/report.controller';
import { verifyAuth } from '../middleware/auth.middleware';
import { reportUpload } from '../config/storage';

const router = Router();

router.use(verifyAuth);

// REQ 4.3: Upload report (Civilian or Doctor)
router.post('/upload', reportUpload.single('file'), uploadReport);

// REQ 4.3: View reports list (REQ_01, REQ_02)
router.get('/', getReports);

// REQ 4.3: View or download report (REQ_03)
router.get('/:id/download', downloadReport);

export default router;
