const axios = require('axios');
const logger = require('../utils/logger');

const pd = axios.create({
  baseURL: process.env.PAGERDUTY_BASE_URL || 'https://api.pagerduty.com',
  headers: {
    Authorization: `Token token=${process.env.PAGERDUTY_API_KEY}`,
    Accept: 'application/vnd.pagerduty+json;version=2',
    'Content-Type': 'application/json'
  }
});

// Get all triggered/acknowledged incidents
async function getTriggeredIncidents() {
  const { data } = await pd.get('/incidents', {
    params: {
      statuses: ['triggered', 'acknowledged'],
      sort_by: 'created_at:desc',
      limit: 50,
      include: ['services', 'assignments', 'escalation_policies']
    }
  });
  return data.incidents;
}

// Get single incident full detail
async function getIncidentById(id) {
  const { data } = await pd.get(`/incidents/${id}`, {
    params: { include: ['services', 'assignments', 'escalation_policies', 'alert_counts'] }
  });
  return data.incident;
}

// Get alerts (individual alerts under an incident)
async function getIncidentAlerts(incidentId) {
  const { data } = await pd.get(`/incidents/${incidentId}/alerts`);
  return data.alerts;
}

// Get log entries (timeline of actions)
async function getIncidentLog(incidentId) {
  const { data } = await pd.get(`/incidents/${incidentId}/log_entries`, {
    params: { include: ['channels'] }
  });
  return data.log_entries;
}

// Get notes on an incident
async function getIncidentNotes(incidentId) {
  const { data } = await pd.get(`/incidents/${incidentId}/notes`);
  return data.notes;
}

// Add a note to an incident
async function addNoteToIncident(incidentId, content, fromEmail) {
  const { data } = await pd.post(`/incidents/${incidentId}/notes`, {
    note: { content }
  }, { headers: { From: fromEmail || 'bot@yourcompany.com' } });
  return data.note;
}

// Acknowledge incident
async function acknowledgeIncident(incidentId, fromEmail) {
  const { data } = await pd.put(`/incidents/${incidentId}`, {
    incident: { type: 'incident_reference', status: 'acknowledged' }
  }, { headers: { From: fromEmail || 'bot@yourcompany.com' } });
  return data.incident;
}

// Resolve incident
async function resolveIncident(incidentId, fromEmail) {
  const { data } = await pd.put(`/incidents/${incidentId}`, {
    incident: { type: 'incident_reference', status: 'resolved' }
  }, { headers: { From: fromEmail || 'bot@yourcompany.com' } });
  return data.incident;
}

// Get on-call schedule
async function getOnCall(scheduleId) {
  const { data } = await pd.get('/oncalls', {
    params: { schedule_ids: [scheduleId], include: ['users'] }
  });
  return data.oncalls;
}

module.exports = {
  getTriggeredIncidents,
  getIncidentById,
  getIncidentAlerts,
  getIncidentLog,
  getIncidentNotes,
  addNoteToIncident,
  acknowledgeIncident,
  resolveIncident,
  getOnCall
};