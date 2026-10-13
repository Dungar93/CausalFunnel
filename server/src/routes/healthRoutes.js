import { Router } from 'express';
import { getHealthHandler } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealthHandler);

export default router;
