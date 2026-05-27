// ─────────────────────────────────────────────────────────────────────────────
// LLM service — Groq inference
//
// Model: llama-3.3-70b-versatile
//   - 70B-parameter Llama, best reasoning in Groq's free-tier model list
//   - 30 RPM · 1K RPD · 12K TPM · 100K TPD (plenty for hackathon use)
//   - JSON mode supported (response_format: { type: "json_object" })
//
// Used to be Anthropic Claude; migrated for Groq's blazing inference speed.
// ─────────────────────────────────────────────────────────────────────────────

const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const SRE_SYSTEM_PROMPT = `You are a senior SRE (10+ years) running an active production incident war room.

You receive correlated signals from PagerDuty, GitHub, Datadog, Sentry, Slack, and Linear — all joined together via a single Coral SQL query. Your job is to produce a concise, structured, actionable incident brief.

RULES:
- Never speculate beyond the data provided. If a signal isn't in the bundle, don't invent it.
- Treat commits pushed within 30 minutes before the incident as prime root-cause suspects.
- If error rate spiked precisely after a deploy, call that correlation out explicitly.
- Keep root_cause to 1-2 sentences. Be specific (mention the commit SHA, the metric, the service).
- Respond with valid JSON ONLY. No markdown, no preamble, no trailing text.`;

// Defensive JSON parse — Groq's JSON mode is reliable but cheap insurance.
function parseJsonish(text) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    logger.warn(`[Groq] JSON parse failed, returning raw. First 200 chars: ${cleaned.slice(0, 200)}`);
    return { raw: cleaned, parse_error: err.message };
  }
}

function logUsage(label, usage) {
  if (!usage) return;
  logger.info(
    `[Groq] ${label}: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`
  );
}

// ─── 1. Incident Brief ───────────────────────────────────────────────────────
async function generateIncidentBrief(bundle) {
  const {
    incident,
    commits = [],
    metricsDelta = [],
    suspectCommits = [],
    slackMessages = [],
    sentryIssues = [],
    linearTickets = [],
    similarPastIncidents = [],
  } = bundle;

  const userPrompt = `
## INCIDENT
ID: ${incident.id}
Title: ${incident.title}
Severity: ${incident.severity}
Service: ${incident.service_name || incident.service?.name || 'unknown'}
Created: ${incident.created_at}
Status: ${incident.status}

## SUSPECT COMMITS (ranked by recency, tight pre-incident window)
${suspectCommits.length
  ? suspectCommits.map((c) => `- [${c.sha?.slice(0, 7)}] ${c.author} (${c.minutes_before_incident?.toFixed?.(0) ?? '?'} min before): ${c.message}`).join('\n')
  : 'None in tight window'}

## ALL RECENT COMMITS (broader window)
${commits.length
  ? commits.map((c) => `- [${c.commit_sha?.slice(0, 7) || c.sha?.slice(0, 7)}] ${c.commit_author || c.author}: ${c.commit_msg || c.message}`).join('\n')
  : 'None'}

## METRIC DELTAS
${metricsDelta.length
  ? metricsDelta.map((m) => `- ${m.metric_name}: peak ${m.peak_value}, avg ${m.avg_value}, min ${m.min_value} (${m.data_points} points)`).join('\n')
  : 'No metric deltas computed'}

## SENTRY ERRORS
${sentryIssues.length
  ? sentryIssues.map((s) => `- [${s.sentry_level || s.level}] ${s.sentry_title || s.title} — seen ${s.sentry_occurrences || s.times_seen}x at ${s.sentry_culprit || s.culprit || 'unknown location'}`).join('\n')
  : 'None'}

## SLACK CONTEXT
${slackMessages.length
  ? slackMessages.slice(0, 10).map((s) => `- ${s.slack_user || s.user}: ${s.slack_msg || s.text}`).join('\n')
  : 'No messages'}

## OPEN LINEAR TICKETS
${linearTickets.length
  ? linearTickets.map((l) => `- ${l.linear_title || l.title} [${l.linear_state || l.state}]`).join('\n')
  : 'None'}

## SIMILAR PAST INCIDENTS (resolved, same service, 90d)
${similarPastIncidents.length
  ? similarPastIncidents.map((p) => `- ${p.id}: ${p.title} (resolved ${p.resolved_at})`).join('\n')
  : 'None — pattern not seen before on this service'}

---
Respond with valid JSON matching this exact shape:
{
  "root_cause": "1-2 sentences naming the most likely cause with specifics",
  "suspicious_commit": { "sha": "...", "author": "...", "message": "..." } or null,
  "blast_radius": "what is affected and approximate impact",
  "recommended_action": "the single highest-priority next step",
  "who_to_page": ["name1", "name2"],
  "severity_assessment": "P1/P2/P3 with one-line reason",
  "rollback_recommended": true or false,
  "rollback_reason": "why or why not",
  "similar_past_incident_id": "INC-... or null",
  "confidence": "High" or "Medium" or "Low",
  "confidence_reason": "what would raise or lower confidence"
}`.trim();

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SRE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 1536,
  });

  logUsage('brief', response.usage);

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty content');
  return parseJsonish(content);
}

// ─── 2. Ask About Incident ───────────────────────────────────────────────────
async function askAboutIncident(bundle, question) {
  const context = JSON.stringify(bundle, null, 2).slice(0, 12000);

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SRE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Incident data:\n\n${context}\n\nQuestion: ${question}\n\nAnswer concisely. Plain prose, not JSON.`,
      },
    ],
    temperature: 0.4,
    max_tokens: 768,
  });

  logUsage('ask', response.usage);
  return response.choices?.[0]?.message?.content ?? '';
}

// ─── 3. Postmortem ───────────────────────────────────────────────────────────
async function generatePostmortem(bundle, resolution) {
  const { incident, commits = [], metrics = [], sentryIssues = [] } = bundle;

  const userPrompt = `
Generate a professional postmortem document.

Incident: ${incident.title} (${incident.id})
Service: ${incident.service_name || incident.service?.name}
Severity: ${incident.severity}
Resolution: ${resolution}
Duration: ${bundle.duration || 'unknown'}

Correlated commits (top 5): ${JSON.stringify(commits.slice(0, 5))}
Key metrics (top 5): ${JSON.stringify(metrics.slice(0, 5))}
Sentry issues (top 3): ${JSON.stringify(sentryIssues.slice(0, 3))}

Output markdown with these exact sections:
# Postmortem: [Title]
## Summary
## Timeline
## Root Cause
## Contributing Factors
## Impact
## Detection
## Resolution
## Action Items
## Lessons Learned

Be specific. Cite commit SHAs and metric values. No fluff.`.trim();

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SRE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 2048,
  });

  logUsage('postmortem', response.usage);
  return response.choices?.[0]?.message?.content ?? '';
}

// ─── 4. NL → SQL search ──────────────────────────────────────────────────────
async function naturalLanguageToSql(question) {
  const userPrompt = `
You generate Coral SQL queries for an SRE incident search interface. Tables:

- pagerduty.incidents (id, title, severity, status, created_at, resolved_at, service_name, slack_channel_id, html_url)
- github.commits (sha, author, message, pushed_at, repository, url)
- datadog.metrics (metric_name, value, timestamp, tags)
- slack.messages (text, user, channel, timestamp)
- sentry.issues (id, title, level, first_seen, times_seen, project, permalink, culprit)
- linear.issues (id, title, state, assignee, url)

User question: ${question}

Respond with JSON only:
{
  "sql": "the SELECT statement",
  "explanation": "one-line description of what the query returns"
}

Rules: SELECT only. Always include LIMIT (default 20). Use ILIKE for name fuzzy-matching.`.trim();

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SRE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 768,
  });

  logUsage('nl-to-sql', response.usage);

  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty content');
  return parseJsonish(content);
}

module.exports = {
  generateIncidentBrief,
  askAboutIncident,
  generatePostmortem,
  naturalLanguageToSql,
  MODEL,
};
