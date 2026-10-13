import { Router } from 'express';
import { getSessionsHandler, getSessionEventsHandler } from '../controllers/sessionController.js';

const router = Router();

router.get('/', getSessionsHandler);
router.get('/:sessionId/events', getSessionEventsHandler);

export default router;
