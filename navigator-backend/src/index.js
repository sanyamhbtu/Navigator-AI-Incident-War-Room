require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const WebSocket = require('ws');
const cron = require('node-cron');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimit');

const healthRoutes = require('./routes/health');
const incidentRoutes = require('./routes/incidents');
const investigateRoutes = require('./routes/investigate');
const slackRoutes = require('./routes/slack');
const linearRoutes = require('./routes/linear');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(rateLimiter);

// ─── Routes ───────────────────────────────────────────────
app.use('/api/health',      healthRoutes);
app.use('/api/incidents',   incidentRoutes);
app.use('/api/investigate', investigateRoutes);
app.use('/api/slack',       slackRoutes);
app.use('/api/linear',      linearRoutes);

// ─── WebSocket (live incident push) ───────────────────────
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  logger.info('WS client connected');
  ws.on('close', () => clients.delete(ws));
});

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

app.set('broadcast', broadcast);

// ─── Cron: poll PagerDuty every 60s and push live ─────────
const pagerdutyService = require('./services/pagerduty');

cron.schedule('* * * * *', async () => {
  try {
    const incidents = await pagerdutyService.getTriggeredIncidents();
    broadcast({ type: 'INCIDENTS_UPDATE', data: incidents, ts: new Date().toISOString() });
  } catch (err) {
    logger.error('Cron poll error: ' + err.message);
  }
});

// ─── Error Handler ────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Navigator backend running on port ${PORT}`);
});