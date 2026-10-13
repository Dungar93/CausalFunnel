/**
 * Middleware to validate incoming tracking event payloads
 */
export function validateEventPayload(req, res, next) {
  const { session_id, event_type, page_url, timestamp, coordinates, viewport } = req.body;

  const errors = [];

  // Validate session_id
  if (!session_id || typeof session_id !== 'string' || session_id.trim().length === 0) {
    errors.push('session_id must be a non-empty string');
  }

  // Validate event_type
  if (!event_type || !['page_view', 'click'].includes(event_type)) {
    errors.push('event_type must be either "page_view" or "click"');
  }

  // Validate page_url
  if (!page_url || typeof page_url !== 'string' || page_url.trim().length === 0) {
    errors.push('page_url must be a non-empty string');
  }

  // Validate timestamp if provided
  if (timestamp !== undefined && timestamp !== null) {
    const parsedDate = new Date(timestamp);
    if (isNaN(parsedDate.getTime())) {
      errors.push('timestamp must be a valid ISO Date string or millisecond timestamp');
    }
  }

  // Validate coordinates for click events
  if (event_type === 'click') {
    if (!coordinates || typeof coordinates !== 'object' || Array.isArray(coordinates)) {
      errors.push('coordinates object with numeric x and y is required for click events');
    } else {
      if (typeof coordinates.x !== 'number' || isNaN(coordinates.x) || coordinates.x < 0) {
        errors.push('coordinates.x must be a non-negative number');
      }
      if (typeof coordinates.y !== 'number' || isNaN(coordinates.y) || coordinates.y < 0) {
        errors.push('coordinates.y must be a non-negative number');
      }
    }
  }

  // Validate viewport if provided
  if (viewport !== undefined && viewport !== null) {
    if (typeof viewport !== 'object' || Array.isArray(viewport)) {
      errors.push('viewport must be an object with width and height');
    } else {
      if (viewport.width !== undefined && (typeof viewport.width !== 'number' || viewport.width < 0)) {
        errors.push('viewport.width must be a positive number');
      }
      if (viewport.height !== undefined && (typeof viewport.height !== 'number' || viewport.height < 0)) {
        errors.push('viewport.height must be a positive number');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid tracking event payload',
      details: errors,
    });
  }

  next();
}
