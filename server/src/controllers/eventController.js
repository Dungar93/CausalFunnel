import { recordEvent } from '../services/eventService.js';

export async function createEventHandler(req, res, next) {
  try {
    const savedEvent = await recordEvent(req.body);
    return res.status(201).json({
      success: true,
      message: 'Event recorded successfully',
      event: {
        id: savedEvent._id,
        session_id: savedEvent.session_id,
        event_type: savedEvent.event_type,
        page_url: savedEvent.page_url,
        timestamp: savedEvent.timestamp,
        coordinates: savedEvent.coordinates,
        viewport: savedEvent.viewport,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentEventsHandler(req, res, next) {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const events = await (await import('../models/Event.js')).default.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (err) {
    next(err);
  }
}
