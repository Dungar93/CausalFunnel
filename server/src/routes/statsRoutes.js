import { Router } from 'express';
import { getStatsSummaryHandler } from '../controllers/statsController.js';

const router = Router();

router.get('/summary', getStatsSummaryHandler);

export default router;
