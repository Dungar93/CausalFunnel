import Event from '../models/Event.js';

export async function getHeatmapClicks(rawUrl) {
  if (!rawUrl) {
    return {
      page_url: '',
      total_clicks: 0,
      clicks: [],
      bounds: null,
    };
  }

  // Handle URL decoding safely
  let targetUrl = rawUrl;
  try {
    targetUrl = decodeURIComponent(rawUrl);
  } catch {
    // If already decoded or malformed URI, fallback to rawUrl
    targetUrl = rawUrl;
  }

  // Retrieve click events for target URL
  const clicks = await Event.find({
    page_url: targetUrl,
    event_type: 'click',
  })
    .sort({ timestamp: -1 })
    .select('coordinates viewport timestamp session_id')
    .lean();

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  clicks.forEach((c) => {
    if (c.coordinates) {
      if (c.coordinates.x < minX) minX = c.coordinates.x;
      if (c.coordinates.x > maxX) maxX = c.coordinates.x;
      if (c.coordinates.y < minY) minY = c.coordinates.y;
      if (c.coordinates.y > maxY) maxY = c.coordinates.y;
    }
  });

  const bounds = clicks.length > 0 && minX !== Infinity
    ? { minX, maxX, minY, maxY }
    : null;

  return {
    page_url: targetUrl,
    total_clicks: clicks.length,
    clicks: clicks.map((c) => ({
      x: c.coordinates?.x,
      y: c.coordinates?.y,
      viewport: c.viewport,
      timestamp: c.timestamp,
      session_id: c.session_id,
    })),
    bounds,
  };
}

export async function getTrackedPages() {
  const pages = await Event.aggregate([
    {
      $group: {
        _id: '$page_url',
        total_events: { $sum: 1 },
        total_views: {
          $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
        },
        total_clicks: {
          $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
        },
        last_activity: { $max: '$timestamp' },
      },
    },
    { $sort: { total_clicks: -1, last_activity: -1 } },
    {
      $project: {
        _id: 0,
        page_url: '$_id',
        total_events: 1,
        total_views: 1,
        total_clicks: 1,
        last_activity: 1,
      },
    },
  ]);

  return pages;
}
