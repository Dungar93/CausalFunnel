# CausalFunnel User Analytics & Heatmap Platform

A production-grade full-stack website user interaction analytics application built for the **CausalFunnel Full Stack Engineer** evaluation.

The platform includes a lightweight, privacy-conscious JavaScript tracking script (`tracker.js`), an Express.js & MongoDB backend providing aggregation and telemetry APIs, and a modern React dashboard visualizing visitor sessions, chronological user journeys, and HTML5 Canvas click heatmaps.

---

## 1. Project Overview

Modern digital businesses need to understand user behavior beyond basic page impressions. This analytics platform captures user interaction telemetry (page loads and coordinate clicks) without third-party external services or expensive vendor subscriptions.

- **Client Tracking Script**: Captures page views and clicks with document-relative coordinates, persists session IDs across navigations, and delivers events with beacon/fetch resiliency.
- **Backend API**: Validates incoming tracking events, persists them in indexed MongoDB collections, and uses high-performance MongoDB aggregation pipelines to extract sessions and heatmaps.
- **Analytics Dashboard**: Inspired by modern SaaS tools (Linear / Stripe), featuring session exploration with chronological journey drawer timelines and dual-mode click heatmaps (density gradient & scatter points).
- **Interactive Demo Website**: A full-featured e-commerce storefront ("Aura Store") pre-instrumented with the tracking script to demonstrate end-to-end data ingestion.

---

## 2. Key Features

- **Causal Conversion Funnel Analysis (`/funnel`)**: Purpose-built for CausalFunnel's core mission. Tracks multi-stage shopper conversion from Store Visitors &rarr; Product Exploration &rarr; Add-to-Cart Intent &rarr; Cart Review & Checkout, calculating drop-off percentages and behavior diagnostics.
- **Real-Time Live Event Stream (`/live`)**: Auto-polling live stream feed capturing events as they happen with pause/resume controls, event type filters, and one-click session inspection.
- **On-Demand Traffic Simulation (`POST /api/simulate`)**: Generate realistic shopper personas and mouse click coordinates with a single click, allowing reviewers to immediately see dynamic data and live dashboard updates.
- **CSV Data Export (`GET /api/sessions/export/csv`)**: Export session records to CSV for spreadsheet analysis or reporting.
- **Interaction Hotspot Clustering**: Aggregates click concentrations by UI element (e.g. Hero CTA vs Product Add to Cart vs Nav vs Cart trigger) directly beneath the Heatmap canvas.
- **Robust Session Identity**: Generates unique cryptographic session IDs stored in `localStorage` with in-memory fallbacks for private/incognito browsing. Reuses the session across reloads without creating spurious sessions on each click.
- **Document-Relative Coordinate Mapping**: Captures `(x, y)` click coordinates relative to the document body (`pageX`, `pageY` / `clientX + scrollLeft`, `clientY + scrollTop`) alongside viewport dimensions for multi-device heatmaps.
- **Dual Heatmap Engine**:
  - **HTML5 Canvas Density Gradient**: Computes thermal heat density using radial alpha gradients mapped through a multi-stop color palette (blue &rarr; cyan &rarr; green &rarr; yellow &rarr; red).
  - **Click Marker Scatter**: Pinpoint markers with pulse animations and hover tooltips showing exact coordinates, timestamps, and session IDs.
  - **Page Layout Alignment**: Renders heatmaps directly over a faithful page representation of the target store so clicks land directly on the interacted elements.
- **Chronological User Journey**: Click on any session row to slide open an interactive timeline displaying each sequential step, time deltas between actions (`+1.8s`), page URLs, and click coordinates.
- **MongoDB Aggregation Pipelines**: Computes total sessions, page views, clicks, first activity, and last activity directly inside MongoDB rather than loading the whole database into Node memory.
- **Production-Ready API Design**: Strict payload validation, HTTP status codes (201, 200, 400, 404, 413, 500, 503), 100kb payload size limit, non-sensitive request logging, CORS, and centralized error handling.
- **Database Health Monitoring**: Continuous heartbeat check between the frontend dashboard and backend MongoDB connection status.

---

## 3. Architecture & Data Flow

```
+--------------------------------------------------------------+
|                        Web Browser                           |
|                                                              |
|  +---------------------+           +----------------------+  |
|  | Aura Store Demo     |           | Analytics Dashboard  |  |
|  | (tracker/demo.html) |           | (React + Vite)       |  |
|  |                     |           |                      |  |
|  | [tracker.js]        |           | - Overview & Charts  |  |
|  | - Session mgmt      |           | - Sessions Explorer  |  |
|  | - Page views        |           | - User Journey Drawer|  |
|  | - Click coordinates |           | - Canvas Heatmap     |  |
|  +----------+----------+           +----------+-----------+  |
+-------------|---------------------------------|--------------+
              | POST /api/events                | GET /api/sessions
              | (fetch keepalive)               | GET /api/heatmap
              v                                 v
+--------------------------------------------------------------+
|               Express.js REST API Server (:5000)             |
|                                                              |
|  - CORS & 100kb Body Limiter                                 |
|  - Event Validation Middleware                               |
|  - Aggregation Services (Sessions & Heatmaps)                |
|  - Static Asset Delivery (/tracker/tracker.js & demo.html)   |
|  - Centralized Error Handler & Health Check                  |
+------------------------------+-------------------------------+
                               |
                               | Mongoose ODM (Indexed Queries)
                               v
+--------------------------------------------------------------+
|                     MongoDB Database                         |
|                                                              |
|  - Collection: 'events'                                      |
|  - Indexes:                                                  |
|      * { session_id: 1, timestamp: 1 }                       |
|      * { page_url: 1, event_type: 1 }                        |
|      * { timestamp: -1 }                                     |
+--------------------------------------------------------------+
```

---

## 4. Technology Stack

### Frontend Client
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React & FontAwesome
- **Charts**: Recharts (Pie / Bar charts for event volume)
- **Heatmap**: HTML5 2D Canvas & SVG overlays
- **Testing**: Vitest & React Testing Library (`@testing-library/react`)

### Backend Server
- **Runtime**: Node.js (v22 / LTS)
- **Framework**: Express.js
- **Database Driver**: Mongoose ODM & MongoDB Driver
- **Middleware**: CORS, Morgan (non-sensitive dev logging), Express JSON body limiter
- **Testing**: Vitest & Supertest

### Client Tracker
- **Runtime**: Vanilla JavaScript (Universal Module Definition - UMD, no build step needed)
- **Bundle Size**: Under 3 KB uncompressed
- **Transport**: `fetch` with `keepalive: true` & XHR fallback

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ or v22 recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (running on port `27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI

---

## 6. Installation & Setup

1. **Clone or Navigate to the Workspace**:
   ```bash
   cd /home/dungar/Documents/Intern_Project
   ```

2. **Install All Monorepo Dependencies**:
   A single root command installs dependencies for the root, backend, and client:
   ```bash
   npm run install:all
   ```

3. **Verify Environment Variables**:
   Copy the sample environment file to `.env`:
   ```bash
   cp .env.example .env
   ```

---

## 7. Environment Variable Configuration

The root `.env` file configures the server and frontend:

| Variable | Description | Default Value |
|---|---|---|
| `PORT` | Backend HTTP server port | `5000` |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) | `mongodb://127.0.0.1:27017/analytics_db` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `CLIENT_URL` | Frontend URL for CORS origin allowance | `http://localhost:5173` |
| `VITE_API_URL` | Base API URL consumed by the React client | `http://localhost:5000/api` |

---

## 8. MongoDB Setup

### Option A: Local MongoDB (Installed & Active)
If MongoDB is installed locally on your machine, ensure the service is running:
```bash
# Verify MongoDB is listening
mongod --dbpath /path/to/data --port 27017 --fork --logpath mongod.log
```
The application connects automatically to `mongodb://127.0.0.1:27017/analytics_db`.

### Option B: MongoDB Atlas (Cloud)
To connect to MongoDB Atlas, set the `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/analytics_db?retryWrites=true&w=majority
```

### Seed Realistic Sample Data
To immediately populate the database with 5 realistic sessions and 24 events:
```bash
npm run seed
```

---

## 9. Starting the Application

You can start both the backend server and frontend client concurrently with a single command:

```bash
npm run dev
```

Or run them individually in separate terminals:

```bash
# Terminal 1: Start Backend (Port 5000)
npm run dev:server

# Terminal 2: Start Frontend Dashboard (Port 5173)
npm run dev:client
```

- **Frontend Dashboard**: Open [http://localhost:5173](http://localhost:5173)
- **Backend API Base**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Demo E-Commerce Store**: [http://localhost:5000/tracker/demo.html](http://localhost:5000/tracker/demo.html)

---

## 10. Instructions to Run the Demo Website

1. Start the server (`npm run dev` or `npm run dev:server`).
2. Open the demo store in your browser:
   ```
   http://localhost:5000/tracker/demo.html
   ```
3. **Generate User Events**:
   - The page automatically fires a `page_view` event upon loading.
   - Click anywhere on the page (e.g. hero CTA buttons, "Add to Cart" buttons, product cards, category filter pills).
   - A floating **Analytics Live HUD** in the bottom-right corner displays your current Session ID, live click count, and coordinates in real-time.
   - Click "Reset Session ID" on the HUD to simulate a new visitor journey.
4. **Inspect in Dashboard**:
   - Open the Analytics Dashboard at [http://localhost:5173](http://localhost:5173).
   - In **Sessions**, click on your session row to see the chronological timeline of actions with click coordinates.
   - In **Heatmap**, select `http://localhost:5000/tracker/demo.html` to see the thermal canvas overlay and click markers.

---

## 11. REST API Documentation

### 1. Ingest Tracking Event
- **Endpoint**: `POST /api/events`
- **Request Body**:
  ```json
  {
    "session_id": "sess_4a8d9b1c-3e2f-410a",
    "event_type": "click",
    "page_url": "http://localhost:5000/tracker/demo.html",
    "timestamp": "2026-10-14T01:15:00.000Z",
    "coordinates": {
      "x": 310,
      "y": 580
    },
    "viewport": {
      "width": 1440,
      "height": 900
    }
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Event recorded successfully",
    "event": {
      "id": "6ace8a4cfb9287305a82dff6",
      "session_id": "sess_4a8d9b1c-3e2f-410a",
      "event_type": "click",
      "page_url": "http://localhost:5000/tracker/demo.html",
      "timestamp": "2026-10-14T01:15:00.000Z",
      "coordinates": { "x": 310, "y": 580 },
      "viewport": { "width": 1440, "height": 900 }
    }
  }
  ```

### 2. List Aggregated Sessions
- **Endpoint**: `GET /api/sessions?page=1&limit=10&search=`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "sessions": [
      {
        "session_id": "sess_user_alpha_9821",
        "total_events": 6,
        "page_views": 1,
        "clicks": 5,
        "first_activity": "2026-10-14T00:10:00.000Z",
        "last_activity": "2026-10-14T00:12:45.000Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
  ```

### 3. Retrieve Chronological Session Events
- **Endpoint**: `GET /api/sessions/:sessionId/events`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "session_id": "sess_user_alpha_9821",
    "count": 2,
    "events": [
      {
        "_id": "6ace8905504a57ce8faaf8d4",
        "event_type": "page_view",
        "page_url": "http://localhost:5000/tracker/demo.html",
        "timestamp": "2026-10-14T00:10:00.000Z",
        "viewport": { "width": 1440, "height": 900 }
      },
      {
        "_id": "6ace8905504a57ce8faaf8d5",
        "event_type": "click",
        "page_url": "http://localhost:5000/tracker/demo.html",
        "timestamp": "2026-10-14T00:10:12.000Z",
        "coordinates": { "x": 420, "y": 160 },
        "viewport": { "width": 1440, "height": 900 }
      }
    ]
  }
  ```

### 4. Fetch Page Heatmap Data
- **Endpoint**: `GET /api/heatmap?url=http%3A%2F%2Flocalhost%3A5000%2Ftracker%2Fdemo.html`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "page_url": "http://localhost:5000/tracker/demo.html",
    "total_clicks": 16,
    "clicks": [
      {
        "x": 310,
        "y": 580,
        "viewport": { "width": 1440, "height": 900 },
        "timestamp": "2026-10-14T00:10:15.000Z",
        "session_id": "sess_user_alpha_9821"
      }
    ],
    "bounds": { "minX": 310, "maxX": 1280, "minY": 45, "maxY": 920 }
  }
  ```

### 5. List Tracked Pages
- **Endpoint**: `GET /api/heatmap/pages`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 1,
    "pages": [
      {
        "page_url": "http://localhost:5000/tracker/demo.html",
        "total_events": 20,
        "total_views": 4,
        "total_clicks": 16,
        "last_activity": "2026-10-14T00:12:45.000Z"
      }
    ]
  }
  ```

### 6. Health Check
- **Endpoint**: `GET /api/health`
- **Response** (`200 OK`):
  ```json
  {
    "status": "healthy",
    "api": "online",
    "database": "connected",
    "timestamp": "2026-10-14T01:15:00.000Z",
    "uptime": 120,
    "version": "1.0.0"
  }
  ```

---

## 12. MongoDB Event Schema

```javascript
{
  session_id:  { type: String, required: true, index: true },
  event_type:  { type: String, required: true, enum: ['page_view', 'click'] },
  page_url:    { type: String, required: true, index: true },
  timestamp:   { type: Date, required: true, default: Date.now },
  coordinates: {
    x: { type: Number, required: function() { return this.event_type === 'click'; } },
    y: { type: Number, required: function() { return this.event_type === 'click'; } }
  },
  viewport: {
    width:  { type: Number },
    height: { type: Number }
  },
  createdAt:   { type: Date, default: Date.now }
}
```

### Coordinate Convention
- Coordinates represent document-relative pixels:
  - `x = event.pageX` (or `event.clientX + window.scrollX`)
  - `y = event.pageY` (or `event.clientY + window.scrollY`)
- Using document-relative coordinates ensures that even if users scroll down to click items halfway through a long catalog, the coordinates map precisely to that section of the document layout.

---

## 13. Embedding Tracker on Any Webpage

To embed the tracker on any external website, include the script tag before the closing `</body>` tag:

```html
<!-- Include tracker library -->
<script src="http://localhost:5000/tracker/tracker.js"></script>

<script>
  // Initialize tracker with target API URL
  AnalyticsTracker.init({
    apiUrl: 'http://localhost:5000/api/events',
    debug: false          // Set to true to view console logs
  });
</script>
```

### Public Methods
- `AnalyticsTracker.getSessionId()`: Returns current session ID string.
- `AnalyticsTracker.resetSession()`: Generates and persists a new session ID.
- `AnalyticsTracker.trackPageView()`: Manually trigger an additional page view (useful in Single Page Applications when client-side route changes).

---

## 14. Running Tests

Both backend and frontend automated test suites can be executed via the root runner:

```bash
# Run both backend and frontend tests
npm run test
```

### Run Backend Tests Separately:
```bash
npm run test:server
```
Covers:
- `GET /api/health` system connectivity
- Valid `page_view` and `click` ingestion
- Schema validation rejections (missing coordinates, invalid event types)
- MongoDB aggregation pipeline and session event counts
- Chronological retrieval of session events
- Heatmap filtering by page URL and URL encoding handling
- Empty results handling

### Run Frontend Tests Separately:
```bash
npm run test:client
```
Covers:
- Sessions page rendering, loading skeletons, and metrics
- Empty states and network error banners
- User journey slide-over timeline rendering
- Heatmap page dropdown selection and click counts

---

## 15. Known Limitations & Design Trade-offs

1. **Authentication**: Authentication is deliberately omitted as specified by assignment requirements, keeping local testing friction-free. For a production multi-tenant deployment, API keys and JWT bearer tokens would secure `/api/events` and dashboard routes.
2. **Dynamic DOM Reflows**: Document-relative coordinates (`pageX`, `pageY`) provide high accuracy for fixed and responsive grid layouts. On extremely dynamic single-page applications with heavy accordion folding or infinite scroll, element-relative selector paths (e.g. `data-track-id`) can complement raw coordinates.
3. **Session Expiry**: Sessions are persisted in `localStorage` indefinitely until manually reset or cleared by the user. A production enhancement would attach a 30-minute inactivity sliding expiration window.
4. **Data Aggregation at Scale**: For high-throughput production (millions of daily events), a message broker (RabbitMQ / Kafka) or time-series rollup table would ingest events asynchronously before writing to MongoDB.

---

## 16. Deployment Instructions

### Docker / Production Run
1. Build the React client:
   ```bash
   npm run build --prefix client
   ```
2. Serve the built client files using Express static hosting or an Nginx reverse proxy pointing `/api` to the Node.js backend.
3. Configure environment variables for production:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your-atlas-production-uri>`
   - `PORT=5000`
4. Run with a process manager:
   ```bash
   pm2 start server/src/server.js --name "analytics-api"
   ```

---

## 17. Screenshots & Interface Preview

| View | Description |
|---|---|
| **Sessions Explorer** | Summary metric cards (Sessions, Events, Views, Clicks), searchable paginated sessions table with last activity timestamps. |
| **User Journey Drawer** | Slide-over drawer with chronological action timeline, event badges, time deltas, and click coordinates. |
| **Click Heatmap (Density)** | Thermal gradient canvas overlaying the Aura Store e-commerce page layout. |
| **Click Heatmap (Markers)** | Interactive scatter points with pulse markers and hover tooltip showing exact `(x, y)` pixels. |
| **Aura Store Demo** | Realistic e-commerce storefront with live Analytics HUD demonstrating event ingestion. |

---

## 18. Verification Checklist (Definition of Done)

- [x] Monorepo structure with clean separation (`client/`, `server/`, `tracker/`).
- [x] Tracking script (`tracker/tracker.js`) supports session generation, localStorage persistence, page views, and click tracking.
- [x] MongoDB Event model with compound indexes.
- [x] Express backend with `/api/events`, `/api/sessions`, `/api/sessions/:sessionId/events`, `/api/heatmap`, and `/api/health`.
- [x] MongoDB aggregation pipeline for session metrics.
- [x] Responsive React dashboard with Tailwind CSS, Lucide icons, and Recharts.
- [x] Dual-mode Heatmap (HTML5 Canvas Gaussian Density + SVG/DOM Markers) aligned to demo page layout.
- [x] User Journey Slide-over panel with step-by-step chronology.
- [x] Interactive demo website (`tracker/demo.html`) with live Analytics HUD.
- [x] Automated backend tests (Vitest + Supertest) passing.
- [x] Automated frontend tests (Vitest + React Testing Library) passing.
- [x] Production build (`vite build`) passing.
- [x] Comprehensive documentation and setup instructions.
