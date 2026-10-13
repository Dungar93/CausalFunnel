import { getFunnelMetrics } from '../services/funnelService.js';

export async function getFunnelMetricsHandler(req, res, next) {
  try {
    const data = await getFunnelMetrics();
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
}
