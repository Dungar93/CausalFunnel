import { Router } from 'express';
import { createEventHandler } from '../controllers/eventController.js';
import { validateEventPayload } from '../middleware/validateEvent.js';

const router = Router();

router.post('/', validateEventPayload, createEventHandler);

export default router;
