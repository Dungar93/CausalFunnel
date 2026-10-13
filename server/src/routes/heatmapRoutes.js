import { Router } from 'express';
import { getHeatmapHandler, getTrackedPagesHandler } from '../controllers/heatmapController.js';

const router = Router();

router.get('/', getHeatmapHandler);
router.get('/pages', getTrackedPagesHandler);

export default router;
