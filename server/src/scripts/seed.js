import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Event from '../models/Event.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/analytics_db';

const BASE_URL = 'http://localhost:5000/tracker/demo.html';

const sampleSessions = [
  {
    sessionId: 'sess_user_alpha_9821',
    viewport: { width: 1440, height: 900 },
    events: [
      { type: 'page_view', delay: 0, url: BASE_URL },
      { type: 'click', delay: 1200, url: BASE_URL, coords: { x: 420, y: 160 } }, // Nav Link: Electronics
      { type: 'click', delay: 3400, url: BASE_URL, coords: { x: 720, y: 340 } }, // Hero CTA "Shop New Arrivals"
      { type: 'click', delay: 7800, url: BASE_URL, coords: { x: 310, y: 580 } }, // Product 1 "Add to Cart"
      { type: 'click', delay: 9200, url: BASE_URL, coords: { x: 310, y: 580 } }, // Product 1 "Add to Cart" again
      { type: 'click', delay: 14000, url: BASE_URL, coords: { x: 1280, y: 45 } }, // Cart icon in header
    ],
  },
  {
    sessionId: 'sess_user_beta_4193',
    viewport: { width: 1366, height: 768 },
    events: [
      { type: 'page_view', delay: 0, url: BASE_URL },
      { type: 'click', delay: 2100, url: BASE_URL, coords: { x: 620, y: 240 } }, // Search input
      { type: 'click', delay: 5600, url: BASE_URL, coords: { x: 710, y: 580 } }, // Product 2 Card
      { type: 'click', delay: 8900, url: BASE_URL, coords: { x: 710, y: 640 } }, // Product 2 "Add to Cart"
      { type: 'click', delay: 16400, url: BASE_URL, coords: { x: 1120, y: 580 } }, // Product 3 Card
    ],
  },
  {
    sessionId: 'sess_user_gamma_7712',
    viewport: { width: 1536, height: 864 },
    events: [
      { type: 'page_view', delay: 0, url: BASE_URL },
      { type: 'click', delay: 1500, url: BASE_URL, coords: { x: 720, y: 340 } }, // Hero CTA
      { type: 'click', delay: 4200, url: BASE_URL, coords: { x: 310, y: 580 } }, // Product 1
      { type: 'click', delay: 7100, url: BASE_URL, coords: { x: 710, y: 640 } }, // Product 2
      { type: 'click', delay: 11000, url: BASE_URL, coords: { x: 1120, y: 640 } }, // Product 3 "Add to Cart"
      { type: 'click', delay: 18500, url: BASE_URL, coords: { x: 600, y: 920 } }, // Newsletter subscribe button
    ],
  },
  {
    sessionId: 'sess_user_delta_3045',
    viewport: { width: 1440, height: 900 },
    events: [
      { type: 'page_view', delay: 0, url: `${BASE_URL}?category=audio` },
      { type: 'click', delay: 2400, url: `${BASE_URL}?category=audio`, coords: { x: 310, y: 580 } }, // Product 1 "Add to Cart"
      { type: 'click', delay: 5100, url: `${BASE_URL}?category=audio`, coords: { x: 315, y: 582 } }, // Product 1 "Add to Cart"
      { type: 'click', delay: 8200, url: `${BASE_URL}?category=audio`, coords: { x: 1280, y: 45 } }, // Cart icon
    ],
  },
  {
    sessionId: 'sess_user_epsilon_6219',
    viewport: { width: 1280, height: 800 },
    events: [
      { type: 'page_view', delay: 0, url: BASE_URL },
      { type: 'click', delay: 900, url: BASE_URL, coords: { x: 510, y: 160 } }, // Nav Link: Apparel
      { type: 'click', delay: 3100, url: BASE_URL, coords: { x: 720, y: 340 } }, // Hero CTA
    ],
  },
];

async function seed() {
  console.log('[Seed] Connecting to MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log('[Seed] Clearing existing events...');
  await Event.deleteMany({});

  const now = Date.now();
  const eventDocs = [];

  for (let i = 0; i < sampleSessions.length; i++) {
    const session = sampleSessions[i];
    // Offset each session start time slightly in the past
    const sessionStartTime = now - (sampleSessions.length - i) * 15 * 60 * 1000;

    for (const ev of session.events) {
      eventDocs.push({
        session_id: session.sessionId,
        event_type: ev.type,
        page_url: ev.url,
        timestamp: new Date(sessionStartTime + ev.delay),
        coordinates: ev.coords || undefined,
        viewport: session.viewport,
      });
    }
  }

  await Event.insertMany(eventDocs);
  console.log(`[Seed] Successfully inserted ${eventDocs.length} events across ${sampleSessions.length} sessions.`);

  await mongoose.disconnect();
  console.log('[Seed] Disconnected from MongoDB. Seed complete!');
}

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
