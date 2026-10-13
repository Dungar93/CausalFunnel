import { getAggregatedSessions, getSessionEvents } from '../services/sessionService.js';

export async function getSessionsHandler(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const result = await getAggregatedSessions({ page, limit, search });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSessionEventsHandler(req, res, next) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'sessionId route parameter is required',
      });
    }

    const events = await getSessionEvents(sessionId);

    return res.status(200).json({
      success: true,
      session_id: sessionId,
      count: events.length,
      events,
    });
  } catch (err) {
    next(err);
  }
}
