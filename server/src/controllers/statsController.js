import Event from '../models/Event.js';

export async function getStatsSummaryHandler(req, res, next) {
  try {
    const [summary] = await Event.aggregate([
      {
        $group: {
          _id: null,
          total_events: { $sum: 1 },
          total_page_views: {
            $sum: { $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0] },
          },
          total_clicks: {
            $sum: { $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0] },
          },
          distinct_sessions: { $addToSet: '$session_id' },
          distinct_pages: { $addToSet: '$page_url' },
        },
      },
      {
        $project: {
          _id: 0,
          total_events: 1,
          total_page_views: 1,
          total_clicks: 1,
          total_sessions: { $size: '$distinct_sessions' },
          total_pages: { $size: '$distinct_pages' },
        },
      },
    ]);

    const result = summary || {
      total_events: 0,
      total_page_views: 0,
      total_clicks: 0,
      total_sessions: 0,
      total_pages: 0,
    };

    return res.status(200).json({
      success: true,
      stats: result,
    });
  } catch (err) {
    next(err);
  }
}
