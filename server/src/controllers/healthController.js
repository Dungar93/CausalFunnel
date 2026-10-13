import { getDatabaseState } from '../config/db.js';

export function getHealthHandler(req, res) {
  const dbStatus = getDatabaseState();
  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    api: 'online',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
  });
}
