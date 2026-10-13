import { Router } from 'express';
import { createEventHandler, getRecentEventsHandler } from '../controllers/eventController.js';
import { validateEventPayload } from '../middleware/validateEvent.js';

const router = Router();

router.get('/recent', getRecentEventsHandler);
router.post('/', validateEventPayload, createEventHandler);

export default router;
