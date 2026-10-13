import { Router } from 'express';
import { getFunnelMetricsHandler } from '../controllers/funnelController.js';

const router = Router();

router.get('/', getFunnelMetricsHandler);

export default router;
