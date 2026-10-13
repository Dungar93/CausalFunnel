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

export async function exportSessionsCsvHandler(req, res, next) {
  try {
    const { sessions } = await getAggregatedSessions({ page: 1, limit: 1000 });
    
    // Build CSV
    const headers = ['Session ID', 'Total Events', 'Page Views', 'Clicks', 'First Activity', 'Last Activity'];
    const rows = sessions.map((s) => [
      `"${s.session_id}"`,
      s.total_events,
      s.page_views,
      s.clicks,
      `"${s.first_activity ? new Date(s.first_activity).toISOString() : ''}"`,
      `"${s.last_activity ? new Date(s.last_activity).toISOString() : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="causalfunnel_sessions.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
