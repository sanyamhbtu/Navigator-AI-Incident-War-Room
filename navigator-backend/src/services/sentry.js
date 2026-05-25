const axios = require('axios');

const sentry = axios.create({
  baseURL: process.env.SENTRY_BASE_URL || 'https://sentry.io/api/0',
  headers: {
    Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

const ORG = process.env.SENTRY_ORG;

// Get all unresolved issues for org
async function getUnresolvedIssues(project = null, limit = 50) {
  const params = { query: 'is:unresolved', limit };
  if (project) params.project = project;

  const { data } = await sentry.get(`/organizations/${ORG}/issues/`, { params });
  return data;
}

// Get issues spiking in last N minutes
async function getSpikingIssues(minutes = 30) {
  const { data } = await sentry.get(`/organizations/${ORG}/issues/`, {
    params: {
      query: `is:unresolved firstSeen:>${minutes}m`,
      sort: 'date',
      limit: 25
    }
  });
  return data;
}

// Get single issue detail
async function getIssueById(issueId) {
  const { data } = await sentry.get(`/issues/${issueId}/`);
  return data;
}

// Get latest events for an issue (stack traces)
async function getIssueEvents(issueId, limit = 5) {
  const { data } = await sentry.get(`/issues/${issueId}/events/`, { params: { limit } });
  return data;
}

// Get hashes (grouping) for an issue
async function getIssueHashes(issueId) {
  const { data } = await sentry.get(`/issues/${issueId}/hashes/`);
  return data;
}

// Get releases
async function getReleases(project, limit = 10) {
  const { data } = await sentry.get(`/organizations/${ORG}/releases/`, {
    params: { project, limit, sort: 'date' }
  });
  return data;
}

// Get stats for an issue (occurrence timeline)
async function getIssueStats(issueId, stat = 'events', resolution = '1h') {
  const { data } = await sentry.get(`/issues/${issueId}/stats/`, {
    params: { stat, resolution }
  });
  return data;
}

// Resolve an issue
async function resolveIssue(issueId) {
  const { data } = await sentry.put(`/issues/${issueId}/`, { status: 'resolved' });
  return data;
}

// Assign issue to a user
async function assignIssue(issueId, username) {
  const { data } = await sentry.put(`/issues/${issueId}/`, { assignedTo: username });
  return data;
}

module.exports = {
  getUnresolvedIssues,
  getSpikingIssues,
  getIssueById,
  getIssueEvents,
  getIssueHashes,
  getReleases,
  getIssueStats,
  resolveIssue,
  assignIssue
};