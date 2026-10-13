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
