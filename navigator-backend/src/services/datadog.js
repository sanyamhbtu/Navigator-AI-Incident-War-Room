const axios = require('axios');

const dd = axios.create({
  baseURL: process.env.DATADOG_BASE_URL || 'https://api.datadoghq.com',
  headers: {
    'DD-API-KEY': process.env.DATADOG_API_KEY,
    'DD-APPLICATION-KEY': process.env.DATADOG_APP_KEY,
    'Content-Type': 'application/json'
  }
});

// Query timeseries metrics
async function queryMetrics(query, from, to) {
  const { data } = await dd.get('/api/v1/query', {
    params: { query, from: Math.floor(from / 1000), to: Math.floor(to / 1000) }
  });
  return data.series;
}

// Get recent monitors in ALERT state
async function getAlertingMonitors() {
  const { data } = await dd.get('/api/v1/monitor', {
    params: { monitor_tags: 'env:production', with_downtimes: true }
  });
  return data.filter(m => ['Alert', 'Warn'].includes(m.overall_state));
}

// Get monitor by ID
async function getMonitorById(monitorId) {
  const { data } = await dd.get(`/api/v1/monitor/${monitorId}`);
  return data;
}

// Get events (deploys, alerts, anomalies) in a time range
async function getEvents(start, end, tags = '') {
  const { data } = await dd.get('/api/v1/events', {
    params: {
      start: Math.floor(start / 1000),
      end: Math.floor(end / 1000),
      tags,
      sources: 'github,deploy,pagerduty'
    }
  });
  return data.events;
}

// Get service-level error rate + p99 latency
async function getServiceMetrics(service, windowMins = 60) {
  const now = Date.now();
  const from = now - windowMins * 60 * 1000;

  const [errors, latency, throughput] = await Promise.all([
    queryMetrics(`sum:trace.servlet.request.errors{service:${service}}.as_rate()`, from, now),
    queryMetrics(`p99:trace.servlet.request.duration{service:${service}}`, from, now),
    queryMetrics(`sum:trace.servlet.request.hits{service:${service}}.as_rate()`, from, now)
  ]);

  return { errors, latency, throughput };
}

// Get infrastructure hosts that are down
async function getDownHosts() {
  const { data } = await dd.get('/api/v1/hosts', {
    params: { filter: 'status:DOWN', count: 50 }
  });
  return data.host_list;
}

// Get logs around a time range
async function getLogs(query, from, to, limit = 100) {
  const { data } = await dd.post('/api/v2/logs/events/search', {
    filter: { query, from: new Date(from).toISOString(), to: new Date(to).toISOString() },
    page: { limit }
  });
  return data.data;
}

module.exports = {
  queryMetrics,
  getAlertingMonitors,
  getMonitorById,
  getEvents,
  getServiceMetrics,
  getDownHosts,
  getLogs
};