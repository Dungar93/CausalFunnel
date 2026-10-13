import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import Event from '../src/models/Event.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/analytics_test_db';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
});

afterAll(async () => {
  // Clean up test database and close connection
  await Event.deleteMany({});
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Event.deleteMany({});
});

describe('API Health Endpoint', () => {
  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
    expect(res.body.api).toBe('online');
  });
});

describe('POST /api/events', () => {
  it('should accept and store a valid page_view event', async () => {
    const payload = {
      session_id: 'test_session_1001',
      event_type: 'page_view',
      page_url: 'http://localhost:5000/tracker/demo.html',
      timestamp: new Date().toISOString(),
      viewport: { width: 1440, height: 900 },
    };

    const res = await request(app).post('/api/events').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event.session_id).toBe('test_session_1001');
    expect(res.body.event.event_type).toBe('page_view');

    const inDb = await Event.findOne({ session_id: 'test_session_1001' });
    expect(inDb).not.toBeNull();
    expect(inDb.event_type).toBe('page_view');
  });

  it('should accept and store a valid click event with coordinates', async () => {
    const payload = {
      session_id: 'test_session_1002',
      event_type: 'click',
      page_url: 'http://localhost:5000/tracker/demo.html',
      timestamp: new Date().toISOString(),
      coordinates: { x: 350, y: 480 },
      viewport: { width: 1440, height: 900 },
    };

    const res = await request(app).post('/api/events').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event.coordinates.x).toBe(350);
    expect(res.body.event.coordinates.y).toBe(480);
  });

  it('should reject a click event missing coordinates with 400', async () => {
    const payload = {
      session_id: 'test_session_1003',
      event_type: 'click',
      page_url: 'http://localhost:5000/tracker/demo.html',
    };

    const res = await request(app).post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
    expect(res.body.details).toEqual(
      expect.arrayContaining([expect.stringContaining('coordinates')])
    );
  });

  it('should reject invalid event_type with 400', async () => {
    const payload = {
      session_id: 'test_session_1004',
      event_type: 'hover',
      page_url: 'http://localhost:5000/tracker/demo.html',
    };

    const res = await request(app).post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('should reject missing session_id with 400', async () => {
    const payload = {
      event_type: 'page_view',
      page_url: 'http://localhost:5000/tracker/demo.html',
    };

    const res = await request(app).post('/api/events').send(payload);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/sessions and Aggregation', () => {
  it('should group events by session_id and calculate accurate totals', async () => {
    const t0 = new Date('2026-10-14T00:00:00Z');
    const t1 = new Date('2026-10-14T00:01:00Z');
    const t2 = new Date('2026-10-14T00:02:00Z');

    await Event.create([
      {
        session_id: 'sess_agg_1',
        event_type: 'page_view',
        page_url: 'http://localhost:5000/demo.html',
        timestamp: t0,
      },
      {
        session_id: 'sess_agg_1',
        event_type: 'click',
        page_url: 'http://localhost:5000/demo.html',
        timestamp: t1,
        coordinates: { x: 100, y: 100 },
      },
      {
        session_id: 'sess_agg_1',
        event_type: 'click',
        page_url: 'http://localhost:5000/demo.html',
        timestamp: t2,
        coordinates: { x: 200, y: 200 },
      },
      {
        session_id: 'sess_agg_2',
        event_type: 'page_view',
        page_url: 'http://localhost:5000/demo.html',
        timestamp: t0,
      },
    ]);

    const res = await request(app).get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.total).toBe(2);

    const s1 = res.body.sessions.find((s) => s.session_id === 'sess_agg_1');
    expect(s1).toBeDefined();
    expect(s1.total_events).toBe(3);
    expect(s1.page_views).toBe(1);
    expect(s1.clicks).toBe(2);

    const s2 = res.body.sessions.find((s) => s.session_id === 'sess_agg_2');
    expect(s2).toBeDefined();
    expect(s2.total_events).toBe(1);
    expect(s2.page_views).toBe(1);
    expect(s2.clicks).toBe(0);
  });

  it('should retrieve chronological events for a specific session', async () => {
    const t1 = new Date('2026-10-14T00:00:10Z');
    const t2 = new Date('2026-10-14T00:00:20Z');

    await Event.create([
      {
        session_id: 'sess_chron',
        event_type: 'click',
        page_url: 'http://localhost:5000/demo.html',
        timestamp: t2,
        coordinates: { x: 50, y: 50 },
      },
      {
        session_id: 'sess_chron',
        event_type: 'page_view',
        page_url: 'http://localhost:5000/demo.html',
        timestamp: t1,
      },
    ]);

    const res = await request(app).get('/api/sessions/sess_chron/events');
    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(2);
    // Chronological order: t1 then t2
    expect(res.body.events[0].event_type).toBe('page_view');
    expect(res.body.events[1].event_type).toBe('click');
  });

  it('should return empty list for unknown session', async () => {
    const res = await request(app).get('/api/sessions/unknown_session_999/events');
    expect(res.status).toBe(200);
    expect(res.body.events).toEqual([]);
    expect(res.body.count).toBe(0);
  });
});

describe('GET /api/heatmap', () => {
  it('should return 400 if url query param is missing', async () => {
    const res = await request(app).get('/api/heatmap');
    expect(res.status).toBe(400);
  });

  it('should return empty clicks array for page with no clicks', async () => {
    const res = await request(app).get('/api/heatmap?url=http%3A%2F%2Fexample.com%2Fnoclicks');
    expect(res.status).toBe(200);
    expect(res.body.total_clicks).toBe(0);
    expect(res.body.clicks).toEqual([]);
  });

  it('should filter clicks by URL correctly with decoded URL', async () => {
    const targetUrl = 'http://localhost:5000/tracker/demo.html';

    await Event.create([
      {
        session_id: 'sess_hm',
        event_type: 'click',
        page_url: targetUrl,
        timestamp: new Date(),
        coordinates: { x: 300, y: 400 },
        viewport: { width: 1440, height: 900 },
      },
      {
        session_id: 'sess_hm',
        event_type: 'page_view',
        page_url: targetUrl,
        timestamp: new Date(),
      },
      {
        session_id: 'sess_hm',
        event_type: 'click',
        page_url: 'http://other-domain.com/other',
        timestamp: new Date(),
        coordinates: { x: 999, y: 999 },
      },
    ]);

    const encoded = encodeURIComponent(targetUrl);
    const res = await request(app).get(`/api/heatmap?url=${encoded}`);
    expect(res.status).toBe(200);
    expect(res.body.total_clicks).toBe(1);
    expect(res.body.clicks[0].x).toBe(300);
    expect(res.body.clicks[0].y).toBe(400);
    expect(res.body.clicks[0].viewport.width).toBe(1440);
  });
});
