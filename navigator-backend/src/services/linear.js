const { LinearClient } = require('@linear/sdk');

const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

const TEAM_ID = process.env.LINEAR_TEAM_ID;

// Create incident issue in Linear
async function createIncidentIssue(incident, aiSummary) {
  const priorityMap = { P1: 1, P2: 2, P3: 3, P4: 4 };

  const issue = await linear.createIssue({
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

## Auto-created by Navigator Bot
    `.trim(),
    priority: priorityMap[incident.severity] || 2,
    labelIds: [],
    estimate: incident.severity === 'P1' ? 8 : 3
  });

  return issue.issue;
}

// Get open issues for a team
async function getOpenIssues(limit = 50) {
  const team = await linear.team(TEAM_ID);
  const issues = await team.issues({
    filter: { state: { type: { in: ['started', 'unstarted', 'backlog'] } } },
    first: limit,
    orderBy: 'updatedAt'
  });
  return issues.nodes;
}

// Get issue by ID
async function getIssueById(issueId) {
  return linear.issue(issueId);
}

// Update issue status
async function updateIssueStatus(issueId, stateName) {
  const issue = await linear.issue(issueId);
  const team = await linear.team(TEAM_ID);
  const states = await team.states();
  const state = states.nodes.find(s => s.name.toLowerCase() === stateName.toLowerCase());
  if (!state) throw new Error(`State "${stateName}" not found`);

  return linear.updateIssue(issueId, { stateId: state.id });
}

// Add comment to an issue
async function addComment(issueId, body) {
  return linear.createComment({ issueId, body });
}

// Get team members
async function getTeamMembers() {
  const team = await linear.team(TEAM_ID);
  const members = await team.members();
  return members.nodes;
}

module.exports = {
  createIncidentIssue,
  getOpenIssues,
  getIssueById,
  updateIssueStatus,
  addComment,
  getTeamMembers
};