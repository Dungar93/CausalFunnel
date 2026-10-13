import Event from '../models/Event.js';

export async function recordEvent(data) {
  const eventDoc = new Event({
    session_id: data.session_id,
    event_type: data.event_type,
    page_url: data.page_url,
    timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    coordinates: data.event_type === 'click' ? data.coordinates : undefined,
    viewport: data.viewport || undefined,
  });

  return await eventDoc.save();
}
