// Typed client for the Reef Next.js API routes.
// Each route is a server-side proxy to navigator-backend; this file is just
// the typed fetch surface the dashboard talks to.

// ─── Types — match the backend's response shape ─────────────────────────────

export type Incident = {
  id: string;
  title: string;
  severity?: string;
  status: "triggered" | "acknowledged" | "resolved";
  created_at: string;
  service?: { name?: string } | null;
  service_name?: string;
  slack_channel_id?: string | null;
  html_url?: string;
};

export type IncidentsResponse = {
  ok?: boolean;
  ts?: string;
  coral?: unknown[];
  live?: {
    incidents: Incident[];
    monitors?: unknown[];
    sentry?: unknown[];
  };
  counts?: {
    incidents: number;
    monitors: number;
    sentry: number;
  };
  // Or — error envelope from the proxy:
  error?: string;
  message?: string;
  hint?: string;
};

export type AIBrief = {
  root_cause?: string;
  suspicious_commit?: { sha?: string; author?: string; message?: string } | null;
  blast_radius?: string;
  recommended_action?: string;
  who_to_page?: string[];
  severity_assessment?: string;
  rollback_recommended?: boolean;
  rollback_reason?: string;
  similar_past_incident_id?: string | null;
  confidence?: "High" | "Medium" | "Low";
  confidence_reason?: string;
  // If Groq failed to return clean JSON the backend wraps it:
  raw?: string;
  parse_error?: string;
};

export type Commit = {
  sha?: string;
  author?: string;
  message?: string;
  pushed_at?: string;
  repo?: string;
  url?: string;
  minutes_before_incident?: number;
};

export type Metric = {
  metric_name?: string;
  value?: number | string;
  timestamp?: string;
  peak_value?: number;
  avg_value?: number;
  spike?: string;
};

export type SentryIssue = {
  id?: string;
  title?: string;
  level?: string;
  first_seen?: string;
  times_seen?: number;
  culprit?: string;
  url?: string;
};

export type SlackMessage = {
  user?: string;
  text?: string;
  timestamp?: string;
};

export type LinearTicket = {
  id?: string;
  title?: string;
  state?: string;
  assignee?: string;
  url?: string;
};

export type InvestigationResponse = {
  ok: boolean;
  incident_id: string;
  investigation: {
    incident: {
      id: string;
      title: string;
      severity?: string;
      status?: string;
      created_at: string;
      service_name?: string;
      slack_channel_id?: string;
      html_url?: string;
    };
    commits?: Commit[];
    metrics?: Metric[];
    metricsDelta?: Metric[];
    suspectCommits?: Commit[];
    slackMessages?: SlackMessage[];
    sentryIssues?: SentryIssue[];
    linearTickets?: LinearTicket[];
    similarPastIncidents?: { id: string; title: string; resolved_at: string }[];
  };
  ai_summary: AIBrief;
  slack?: unknown;
  linear?: unknown;
  coral_queries_executed?: number;
  ts: string;
  // proxy error envelope:
  error?: string;
  message?: string;
  hint?: string;
};

// ─── Fetch helpers ─────────────────────────────────────────────────────────

export async function fetchHealth(): Promise<{
  ok: boolean;
  backend?: string;
  hint?: string;
  status?: number;
}> {
  const res = await fetch("/api/health", { cache: "no-store" });
  return res.json();
}

export async function fetchIncidents(): Promise<IncidentsResponse> {
  const res = await fetch("/api/incidents", { cache: "no-store" });
  return res.json();
}

export async function fetchInvestigation(
  id: string,
  opts: { post_slack?: boolean; create_linear?: boolean } = {},
): Promise<InvestigationResponse> {
  const qs = new URLSearchParams();
  if (opts.post_slack) qs.set("post_slack", "true");
  if (opts.create_linear) qs.set("create_linear", "true");
  const url = `/api/investigate/${encodeURIComponent(id)}${qs.toString() ? "?" + qs.toString() : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}
