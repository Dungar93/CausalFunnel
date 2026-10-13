import Event from '../models/Event.js';

export async function getAggregatedSessions({ page = 1, limit = 10, search = '' } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const matchStage = {};
  if (search && search.trim()) {
    matchStage.session_id = { $regex: search.trim(), $options: 'i' };
  }

  const pipeline = [];

  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Group events by session_id
  pipeline.push({
    $group: {
      _id: '$session_id',
      total_events: { $sum: 1 },
      page_views: {
        $sum: {
          $cond: [{ $eq: ['$event_type', 'page_view'] }, 1, 0],
        },
      },
      clicks: {
        $sum: {
          $cond: [{ $eq: ['$event_type', 'click'] }, 1, 0],
        },
      },
      first_activity: { $min: '$timestamp' },
      last_activity: { $max: '$timestamp' },
    },
  });

  // Sort by most recent activity first
  pipeline.push({
    $sort: { last_activity: -1 },
  });

  // Facet for pagination and metadata
  pipeline.push({
    $facet: {
      metadata: [{ $count: 'total' }],
      sessions: [
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            _id: 0,
            session_id: '$_id',
            total_events: 1,
            page_views: 1,
            clicks: 1,
            first_activity: 1,
            last_activity: 1,
          },
        },
      ],
    },
  });

  const [result] = await Event.aggregate(pipeline);

  const total = result.metadata[0]?.total || 0;
  const sessions = result.sessions || [];
  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    sessions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  };
}

export async function getSessionEvents(sessionId) {
  if (!sessionId) {
    return [];
  }

  // Retrieve events chronologically
  const events = await Event.find({ session_id: sessionId })
    .sort({ timestamp: 1 })
    .select('event_type page_url timestamp coordinates viewport createdAt')
    .lean();

  return events;
}
