// Linear service — lazy-initialised so missing LINEAR_API_KEY doesn't crash
// the backend at startup. Each function throws on use if not configured.

const logger = require('../utils/logger');

let linear = null;
let initFailed = false;

function getClient() {
  if (linear) return linear;
  if (initFailed) throw new Error('Linear not configured (LINEAR_API_KEY missing)');
  if (!process.env.LINEAR_API_KEY) {
    initFailed = true;
    throw new Error('Linear not configured (LINEAR_API_KEY missing)');
  }
  try {
    const { LinearClient } = require('@linear/sdk');
    linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
    return linear;
  } catch (err) {
    initFailed = true;
    logger.warn(`[Linear] init failed: ${err.message}`);
    throw err;
  }
}

const TEAM_ID = process.env.LINEAR_TEAM_ID;

async function createIncidentIssue(incident, aiSummary) {
  const client = getClient();
  const priorityMap = { P1: 1, P2: 2, P3: 3, P4: 4 };

  const issue = await client.createIssue({
    teamId: TEAM_ID,
    title: `[INCIDENT] ${incident.title}`,
    description: `
## Incident Details
- **ID:** ${incident.id}
- **Severity:** ${incident.severity}
- **Service:** ${incident.service_name}
- **Created:** ${incident.created_at}
- **PagerDuty:** ${incident.html_url}

## AI Analysis
${aiSummary}

## Auto-created by Reef
    `.trim(),
    priority: priorityMap[incident.severity] || 2,
    labelIds: [],
    estimate: incident.severity === 'P1' ? 8 : 3,
  });

  return issue.issue;
}

async function getOpenIssues(limit = 50) {
  const client = getClient();
  const team = await client.team(TEAM_ID);
  const issues = await team.issues({
    filter: { state: { type: { in: ['started', 'unstarted', 'backlog'] } } },
    first: limit,
    orderBy: 'updatedAt',
  });
  return issues.nodes;
}

async function getIssueById(issueId) {
  return getClient().issue(issueId);
}

async function updateIssueStatus(issueId, stateName) {
  const client = getClient();
  await client.issue(issueId);
  const team = await client.team(TEAM_ID);
  const states = await team.states();
  const state = states.nodes.find((s) => s.name.toLowerCase() === stateName.toLowerCase());
  if (!state) throw new Error(`State "${stateName}" not found`);
  return client.updateIssue(issueId, { stateId: state.id });
}

async function addComment(issueId, body) {
  return getClient().createComment({ issueId, body });
}

async function getTeamMembers() {
  const client = getClient();
  const team = await client.team(TEAM_ID);
  const members = await team.members();
  return members.nodes;
}

module.exports = {
  createIncidentIssue,
  getOpenIssues,
  getIssueById,
  updateIssueStatus,
  addComment,
  getTeamMembers,
};
