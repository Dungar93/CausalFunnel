import { getHeatmapClicks, getTrackedPages } from '../services/heatmapService.js';

export async function getHeatmapHandler(req, res, next) {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "url" is required',
      });
    }

    const data = await getHeatmapClicks(rawUrl);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrackedPagesHandler(req, res, next) {
  try {
    const pages = await getTrackedPages();
    return res.status(200).json({
      success: true,
      count: pages.length,
      pages,
    });
  } catch (err) {
    next(err);
  }
}
