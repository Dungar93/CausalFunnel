import { Router } from 'express';
import { simulateShopperSessions } from '../services/simulationService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const count = parseInt(req.body.count, 10) || 3;
    const result = await simulateShopperSessions(count);
    return res.status(201).json({
      success: true,
      message: `Successfully simulated ${result.sessions.length} shopper sessions with ${result.insertedEvents} events`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
