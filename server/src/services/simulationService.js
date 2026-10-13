import Event from '../models/Event.js';

const DEMO_URL = 'http://localhost:5000/tracker/demo.html';

export async function simulateShopperSessions(count = 3) {
  const generatedSessions = [];
  const now = Date.now();

  const personas = [
    {
      name: 'High-Intent Audio Buyer',
      viewport: { width: 1440, height: 900 },
      steps: [
        { type: 'page_view', delay: 0 },
        { type: 'click', delay: 1800, coords: { x: 420, y: 160 } }, // Nav Audio
        { type: 'click', delay: 4100, coords: { x: 720, y: 340 } }, // Hero CTA
        { type: 'click', delay: 8200, coords: { x: 310, y: 580 } }, // Product 1 Add to Cart
        { type: 'click', delay: 12500, coords: { x: 1280, y: 45 } }, // Header Cart
      ],
    },
    {
      name: 'Smartwatch Comparer',
      viewport: { width: 1366, height: 768 },
      steps: [
        { type: 'page_view', delay: 0 },
        { type: 'click', delay: 2400, coords: { x: 620, y: 240 } }, // Search bar
        { type: 'click', delay: 6300, coords: { x: 710, y: 580 } }, // Product 2 Watch
        { type: 'click', delay: 9800, coords: { x: 710, y: 640 } }, // Watch Add to Cart
      ],
    },
    {
      name: 'Bespoke Accessory Browser',
      viewport: { width: 1536, height: 864 },
      steps: [
        { type: 'page_view', delay: 0 },
        { type: 'click', delay: 1400, coords: { x: 510, y: 160 } }, // Nav Wearables
        { type: 'click', delay: 4900, coords: { x: 1120, y: 640 } }, // Product 3 Add to Cart
        { type: 'click', delay: 8800, coords: { x: 600, y: 920 } }, // Newsletter subscribe
      ],
    },
  ];

  const docsToInsert = [];

  for (let i = 0; i < Math.min(count, personas.length); i++) {
    const persona = personas[i];
    const sessionId = `sess_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionStart = now - (i * 120000); // within last few minutes

    for (const step of persona.steps) {
      docsToInsert.push({
        session_id: sessionId,
        event_type: step.type,
        page_url: DEMO_URL,
        timestamp: new Date(sessionStart + step.delay),
        coordinates: step.coords || undefined,
        viewport: persona.viewport,
      });
    }

    generatedSessions.push({
      session_id: sessionId,
      persona: persona.name,
      eventsCount: persona.steps.length,
    });
  }

  await Event.insertMany(docsToInsert);

  return {
    insertedEvents: docsToInsert.length,
    sessions: generatedSessions,
  };
}
