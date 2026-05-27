// Mock incident data for the embedded interactive demo.
// All values are designed to tell a coherent story:
// — INC-042 is the hero incident: a payments-api deploy broke Stripe webhooks,
//   error rate spiked 470x, blast radius is revenue-impacting.
// — INC-041 and INC-040 give the incidents list some texture (P2/P3).

export type Incident = {
  id: string;
  title: string;
  severity: "P1" | "P2" | "P3";
  service: string;
  triggeredAt: string;
  ageMinutes: number;
};

export type AIBrief = {
  root_cause: string;
  suspicious_commit: { sha: string; author: string; message: string };
  blast_radius: string;
  recommended_action: string;
  who_to_page: string[];
  severity_assessment: string;
  rollback_recommended: boolean;
  rollback_reason: string;
  similar_past_incident_id: string | null;
  confidence: "High" | "Medium" | "Low";
  confidence_reason: string;
};

export type TimelineEvent = {
  time: string;
  type: "commit" | "metric" | "alert" | "slack" | "sentry";
  actor: string;
  text: string;
};

export const INCIDENTS: Incident[] = [
  {
    id: "INC-042",
    title: "payments-api 5xx error rate spike",
    severity: "P1",
    service: "payments-api",
    triggeredAt: "02:14 UTC",
    ageMinutes: 14,
  },
  {
    id: "INC-041",
    title: "auth-svc login latency degraded",
    severity: "P2",
    service: "auth-svc",
    triggeredAt: "01:52 UTC",
    ageMinutes: 36,
  },
  {
    id: "INC-040",
    title: "search-api p99 above SLO",
    severity: "P3",
    service: "search-api",
    triggeredAt: "00:14 UTC",
    ageMinutes: 134,
  },
];

export const HERO_BRIEF: AIBrief = {
  root_cause:
    "Deploy a8f2c39 by @rahul refactored the Stripe webhook handler at 02:09 UTC and removed signature verification fallback. Error rate jumped from 0.1% to 47% within 3 minutes — a 470x spike correlating exactly with the deploy timestamp.",
  suspicious_commit: {
    sha: "a8f2c39",
    author: "rahul",
    message: "refactor: simplify stripe webhook handler",
  },
  blast_radius:
    "All payment endpoints (~2,400 active checkout sessions). Estimated $14k/min revenue impact. No graceful degradation path — failures cascade to retry queue.",
  recommended_action: "Revert commit a8f2c39 immediately via PR #1402.",
  who_to_page: ["@rahul", "@payments-oncall", "@payments-eng-manager"],
  severity_assessment: "P1 confirmed — revenue impact + no fallback path.",
  rollback_recommended: true,
  rollback_reason:
    "Linear correlation between deploy and error spike. No other config or infra changes in the 1-hour window. Rollback is safer than forward-fix at this severity.",
  similar_past_incident_id: "INC-0029 (March 2026, same service, same author cluster)",
  confidence: "High",
  confidence_reason:
    "Single commit in the 30-minute window, deploy-spike correlation < 1 minute, prior incident pattern match.",
};

export const HERO_TIMELINE: TimelineEvent[] = [
  { time: "01:58", type: "commit", actor: "rahul", text: "pushed a8f2c39 to main" },
  { time: "02:09", type: "metric", actor: "datadog", text: "error_rate 0.1% → 47%" },
  { time: "02:14", type: "alert", actor: "pagerduty", text: "payments-api P1 triggered" },
  { time: "02:16", type: "slack", actor: "priya", text: "anyone seeing 500s on payments?" },
  { time: "02:17", type: "sentry", actor: "sentry", text: "StripeSignatureError × 2,847" },
];

export const HERO_COMMITS = [
  { sha: "a8f2c39", author: "rahul", message: "refactor: simplify stripe webhook handler", minutes_before: 5 },
  { sha: "7b1d4f2", author: "priya", message: "bump @stripe/sdk to 14.2.0", minutes_before: 48 },
  { sha: "3c9e8a1", author: "rahul", message: "add retry middleware for outbound webhooks", minutes_before: 96 },
];

export const HERO_METRICS = [
  { name: "http.5xx_rate", peak: "47.3%", avg: "0.1%", spike: "470x" },
  { name: "stripe.webhook.failure", peak: "2,847", avg: "0", spike: "∞" },
  { name: "checkout.success_rate", peak: "12.1%", avg: "98.9%", spike: "-87%" },
];

export const HERO_SENTRY = [
  { title: "StripeSignatureError: invalid_signature", level: "fatal", count: 2847, culprit: "src/webhooks/stripe.ts:42" },
  { title: "WebhookTimeout: 30s exceeded", level: "error", count: 412, culprit: "src/webhooks/stripe.ts:78" },
];

export const HERO_SLACK = [
  { user: "priya", text: "anyone seeing 500s on payments?" },
  { user: "rahul", text: "just pushed a webhook refactor — let me look" },
  { user: "ops-bot", text: "🚨 PagerDuty: payments-api P1 triggered" },
];

export const HERO_LINEAR = [
  { title: "Stripe webhooks intermittent failures", state: "in_progress", assignee: "rahul" },
];
