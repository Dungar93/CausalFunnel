import { Router } from 'express';
import {
  getSessionsHandler,
  getSessionEventsHandler,
  exportSessionsCsvHandler,
} from '../controllers/sessionController.js';

const router = Router();

router.get('/export/csv', exportSessionsCsvHandler);
router.get('/', getSessionsHandler);
router.get('/:sessionId/events', getSessionEventsHandler);

export default router;
