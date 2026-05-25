const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate AI brief for a full incident with all correlated data
async function generateIncidentBrief(incidentData) {
  const { incident, commits, metrics, slackMessages, sentryIssues } = incidentData;

  const prompt = `
You are an expert SRE analyzing an active production incident. Analyze all correlated signals and produce a concise, actionable incident brief.

## INCIDENT
ID: ${incident.id}
Title: ${incident.title}
Severity: ${incident.severity}
Service: ${incident.service_name}
Created: ${incident.created_at}

## RECENT COMMITS (last 4h before incident)
${commits.length ? commits.map(c => `- [${c.sha?.slice(0, 7)}] ${c.author}: ${c.message} (${c.pushed_at})`).join('\n') : 'None'}

## METRICS ANOMALIES
${metrics.length ? metrics.map(m => `- ${m.metric_name}: ${m.metric_val} at ${m.metric_ts}`).join('\n') : 'No anomalies found'}

## SENTRY ERRORS (correlated timeframe)
${sentryIssues.length ? sentryIssues.map(s => `- [${s.level}] ${s.title} — seen ${s.times_seen}x (${s.first_seen})`).join('\n') : 'None'}

## SLACK CONTEXT
${slackMessages.length ? slackMessages.slice(0, 10).map(s => `- ${s.slack_user}: ${s.slack_msg}`).join('\n') : 'No messages'}

---
Respond with:
1. **Root Cause Hypothesis** (most likely cause based on signals)
2. **Blast Radius** (what is affected and how many users)
3. **Suspect Commits** (which commit(s) likely triggered this, if any)
4. **Immediate Actions** (numbered, prioritized steps to resolve NOW)
5. **Rollback Recommendation** (yes/no and why)
6. **Confidence** (High/Medium/Low with reasoning)

Be direct, technical, and specific. No fluff.
  `.trim();

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}

// Ask Claude a freeform question about an incident
async function askAboutIncident(incidentData, question) {
  const context = JSON.stringify(incidentData, null, 2).slice(0, 8000);

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are an SRE assistant. Here is incident data:\n\n${context}\n\nQuestion: ${question}`
      }
    ]
  });

  return response.content[0].text;
}

// Generate a postmortem draft
async function generatePostmortem(incidentData, resolution) {
  const prompt = `
Generate a professional incident postmortem document for:

Incident: ${incidentData.incident.title}
Service: ${incidentData.incident.service_name}
Duration: ${incidentData.duration || 'Unknown'}
Severity: ${incidentData.incident.severity}
Resolution: ${resolution}

Correlated commits: ${JSON.stringify(incidentData.commits?.slice(0, 5))}
Key metrics: ${JSON.stringify(incidentData.metrics?.slice(0, 5))}
Sentry issues: ${JSON.stringify(incidentData.sentryIssues?.slice(0, 3))}

Format as a proper postmortem with sections:
# Postmortem: [Title]
## Summary
## Timeline
## Root Cause
## Contributing Factors
## Impact
## Detection
## Resolution
## Action Items (with owners and due dates)
## Lessons Learned
  `.trim();

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}

module.exports = { generateIncidentBrief, askAboutIncident, generatePostmortem };