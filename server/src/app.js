import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import eventRoutes from './routes/eventRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import heatmapRoutes from './routes/heatmapRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration supporting local development and external tracker integration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or file:// origin in some browsers)
      if (!origin || allowedOrigins.includes(origin) || origin === 'null') {
        return callback(null, true);
      }
      // For assignment / local testing demo embedding, permit localhost origins
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev for tracker embedding
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// Logging - standard non-sensitive dev logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Security: limit body size to 100kb to prevent payload abuse
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Serve tracker script and demo page statically
const trackerDir = path.resolve(__dirname, '../../tracker');
app.use('/tracker', express.static(trackerDir));

// API Routes
app.use('/api/events', eventRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/stats', statsRoutes);

// Fallback 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
