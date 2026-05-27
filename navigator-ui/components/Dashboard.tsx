"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertOctagon,
  ArrowUpRight,
  GitCommit,
  Loader2,
  RefreshCw,
  RotateCcw,
  Send,
  Ticket,
  Zap,
  XCircle,
} from "lucide-react";
import {
  fetchHealth,
  fetchIncidents,
  fetchInvestigation,
  type Incident,
  type InvestigationResponse,
} from "@/lib/api";

const SEVERITY_BADGE: Record<string, string> = {
  P1: "bg-red/15 text-red border-red/30",
  P2: "bg-yellow/15 text-yellow border-yellow/30",
  P3: "bg-blue/15 text-blue border-blue/30",
  P4: "bg-fg-muted/15 text-fg-muted border-fg-muted/30",
};

function severityClass(sev?: string) {
  if (!sev) return SEVERITY_BADGE.P3;
  const norm = sev.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return SEVERITY_BADGE[norm] || SEVERITY_BADGE.P3;
}

function relativeAge(iso?: string): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms) || ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "<1m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type BackendHealth = "checking" | "online" | "offline";

export function Dashboard() {
  const [health, setHealth] = useState<BackendHealth>("checking");
  const [healthHint, setHealthHint] = useState<string | undefined>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [investigationError, setInvestigationError] = useState<string | undefined>();

  const loadIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    setIncidentsError(undefined);
    try {
      const data = await fetchIncidents();
      if (data.error) {
        setIncidentsError(data.hint || data.error);
        setIncidents([]);
      } else {
        // Coral is the source of truth. live.incidents is a REST overlay that
        // only populates if real PagerDuty credentials are configured.
        const coralList = (data.coral as Incident[] | undefined) ?? [];
        const liveList = data.live?.incidents ?? [];
        setIncidents(coralList.length ? coralList : liveList);
      }
    } catch (err) {
      setIncidentsError(err instanceof Error ? err.message : "Network error");
      setIncidents([]);
    } finally {
      setIncidentsLoading(false);
    }
  }, []);

  // Health check on mount, then load incidents
  useEffect(() => {
    (async () => {
      try {
        const h = await fetchHealth();
        setHealth(h.ok ? "online" : "offline");
        setHealthHint(h.hint);
      } catch {
        setHealth("offline");
        setHealthHint("Run: cd navigator-backend && npm run dev");
      }
      await loadIncidents();
    })();
  }, [loadIncidents]);

  // Auto-refresh incidents every 60s when backend is online
  useEffect(() => {
    if (health !== "online") return;
    const interval = setInterval(loadIncidents, 60000);
    return () => clearInterval(interval);
  }, [health, loadIncidents]);

  async function investigate(id: string) {
    setSelectedId(id);
    setInvestigation(null);
    setInvestigationError(undefined);
    setInvestigationLoading(true);
    try {
      const data = await fetchInvestigation(id);
      if (!data.ok && data.error) {
        setInvestigationError(data.hint || data.error);
      } else {
        setInvestigation(data);
      }
    } catch (err) {
      setInvestigationError(err instanceof Error ? err.message : "Network error");
    } finally {
      setInvestigationLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 pb-24">
      {/* Top status bar */}
      <div className="neumorph-card px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-base">🪸</span>
          <span className="font-semibold text-sm">Reef</span>
          <span className="text-fg-subtle text-sm">/</span>
          <span className="text-sm text-fg-muted">War room</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <HealthIndicator status={health} hint={healthHint} />
          <button
            onClick={loadIncidents}
            disabled={incidentsLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-fg-muted hover:text-fg hover:bg-panel transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3 ${incidentsLoading ? "animate-spin" : ""}`} />
            refresh
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Sidebar — incidents list */}
        <aside className="neumorph-card p-3 h-fit lg:sticky lg:top-24">
          <div className="px-3 pt-2 pb-3 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle">
              Active incidents
            </span>
            <span className="text-[10px] font-mono text-fg-subtle tabular-nums">
              {incidents.length}
            </span>
          </div>

          {incidentsLoading && incidents.length === 0 && (
            <SkeletonList />
          )}

          {!incidentsLoading && incidentsError && (
            <BackendDownNotice hint={incidentsError} onRetry={loadIncidents} />
          )}

          {!incidentsLoading && !incidentsError && incidents.length === 0 && (
            <EmptyState />
          )}

          <ul className="space-y-1">
            {incidents.map((inc) => (
              <IncidentRow
                key={inc.id}
                incident={inc}
                active={selectedId === inc.id}
                onClick={() => investigate(inc.id)}
                disabled={investigationLoading}
              />
            ))}
          </ul>
        </aside>

        {/* Main view */}
        <main className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {!selectedId && !investigationLoading && (
              <NoSelection key="empty" />
            )}

            {investigationLoading && (
              <InvestigatingState key="loading" id={selectedId} />
            )}

            {investigationError && !investigationLoading && (
              <ErrorState
                key="error"
                error={investigationError}
                onRetry={() => selectedId && investigate(selectedId)}
              />
            )}

            {investigation && !investigationLoading && !investigationError && (
              <InvestigationView key="result" data={investigation} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar incident row ─────────────────────────────────────────────────

function IncidentRow({
  incident,
  active,
  onClick,
  disabled,
}: {
  incident: Incident;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const service =
    incident.service?.name || incident.service_name || "unknown";
  return (
    <li>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-left p-3 rounded-lg transition-all ${
          active ? "neumorph-coral" : "hover:bg-panel/50"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-baseline justify-between mb-1 text-[11px] font-mono">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 border rounded font-semibold ${severityClass(
              incident.severity,
            )}`}
          >
            {(incident.severity || "P3").toUpperCase()}
          </span>
          <span className="text-fg-subtle">{relativeAge(incident.created_at)}</span>
        </div>
        <div className="text-sm font-medium text-fg leading-snug mb-0.5 line-clamp-2">
          {incident.title || incident.id}
        </div>
        <div className="text-[11px] font-mono text-fg-subtle">{service}</div>
      </button>
    </li>
  );
}

// ─── States ────────────────────────────────────────────────────────────────

function HealthIndicator({
  status,
  hint,
}: {
  status: BackendHealth;
  hint?: string;
}) {
  if (status === "checking")
    return (
      <span className="flex items-center gap-1.5 text-fg-subtle">
        <Loader2 className="size-3 animate-spin" /> checking
      </span>
    );
  if (status === "online")
    return (
      <span className="flex items-center gap-1.5 text-coral" title="Backend connected">
        <span className="size-1.5 rounded-full bg-coral pulse-dot" />
        backend online
      </span>
    );
  return (
    <span
      className="flex items-center gap-1.5 text-red"
      title={hint || "Backend unreachable"}
    >
      <XCircle className="size-3" />
      backend offline
    </span>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-1">
      {[0, 1, 2].map((i) => (
        <li key={i} className="p-3 rounded-lg">
          <div className="h-3 w-12 bg-panel rounded mb-2 animate-pulse" />
          <div className="h-4 w-full bg-panel rounded mb-1 animate-pulse" />
          <div className="h-3 w-20 bg-panel rounded animate-pulse" />
        </li>
      ))}
    </ul>
  );
}

function BackendDownNotice({
  hint,
  onRetry,
}: {
  hint: string;
  onRetry: () => void;
}) {
  return (
    <div className="neumorph-inset p-4 m-1">
      <div className="flex items-center gap-2 mb-2 text-red text-xs font-semibold">
        <XCircle className="size-4" />
        Backend unreachable
      </div>
      <p className="text-xs text-fg-muted leading-relaxed mb-3">
        Start the navigator-backend dev server:
      </p>
      <pre className="text-[10px] font-mono bg-bg/50 px-2 py-1.5 rounded text-fg leading-tight">
        cd navigator-backend{"\n"}
        npm run dev
      </pre>
      {hint && hint !== "Backend unreachable" && (
        <p className="text-[10px] text-fg-subtle mt-2">{hint}</p>
      )}
      <button
        onClick={onRetry}
        className="mt-3 w-full text-[11px] font-medium text-coral hover:text-coral-soft py-1.5 transition-colors"
      >
        Try again →
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-6 text-center">
      <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-1">
        all clear
      </div>
      <p className="text-xs text-fg-muted">No active incidents.</p>
    </div>
  );
}

function NoSelection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="neumorph-card p-12 text-center flex flex-col items-center justify-center min-h-[600px]"
    >
      <div className="size-14 rounded-2xl bg-coral/10 flex items-center justify-center mb-4">
        <AlertOctagon className="size-6 text-coral" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Select an incident</h3>
      <p className="text-sm text-fg-muted max-w-sm leading-relaxed">
        Reef runs one Coral query across six tools and hands the result to
        Llama 3.3 70B on Groq. Pick an incident from the sidebar to investigate.
      </p>
    </motion.div>
  );
}

function InvestigatingState({ id }: { id: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="neumorph-card p-8 min-h-[600px]"
    >
      <div className="flex items-center gap-2 text-coral mb-6">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm font-semibold">Investigating {id}…</span>
      </div>
      <div className="space-y-5">
        <ProgressLine label="coral sql" detail="joining 6 sources" />
        <ProgressLine label="llama-3.3-70b · groq" detail="JSON mode · 270 t/s" />
        <ProgressLine label="format" detail="root_cause · commit · action · page" />
      </div>
    </motion.div>
  );
}

function ProgressLine({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="neumorph-inset p-4">
      <div className="flex items-center gap-2 mb-3 text-[11px] font-mono">
        <Loader2 className="size-3 animate-spin text-coral" />
        <span className="text-fg">{label}</span>
        <span className="text-fg-subtle">· {detail}</span>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 bg-coral/15 rounded animate-pulse" style={{ width: "92%" }} />
        <div className="h-1.5 bg-coral/15 rounded animate-pulse" style={{ width: "78%" }} />
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="neumorph-card p-8 min-h-[400px]"
    >
      <div className="flex items-center gap-2 text-red mb-4">
        <XCircle className="size-5" />
        <span className="text-sm font-semibold">Investigation failed</span>
      </div>
      <p className="text-sm text-fg-muted mb-2">
        Reef could not reach the backend or Groq.
      </p>
      <pre className="neumorph-inset p-3 text-[11px] font-mono text-fg leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {error}
      </pre>
      <button
        onClick={onRetry}
        className="mt-5 px-4 py-2 bg-coral text-bg rounded-md text-sm font-semibold brutal-shadow-sm brutal-hover"
      >
        Retry
      </button>
    </motion.div>
  );
}

// ─── Investigation view ────────────────────────────────────────────────────

function InvestigationView({ data }: { data: InvestigationResponse }) {
  const inc = data.investigation.incident;
  const brief = data.ai_summary;
  const suspectCommits = data.investigation.suspectCommits ?? [];
  const metricsDelta = data.investigation.metricsDelta ?? [];
  const sentryIssues = data.investigation.sentryIssues ?? [];
  const linearTickets = data.investigation.linearTickets ?? [];
  const queries = data.coral_queries_executed ?? 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Incident header */}
      <div className="neumorph-card p-6">
        <div className="flex items-baseline gap-3 mb-2 text-[11px] font-mono flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 border rounded font-semibold ${severityClass(
              inc.severity,
            )}`}
          >
            {(inc.severity || "P3").toUpperCase()}
          </span>
          <span className="text-fg-subtle">{inc.id}</span>
          <span className="text-fg-subtle">·</span>
          <span className="text-fg-subtle">
            {new Date(inc.created_at).toLocaleString()}
          </span>
          <span className="text-fg-subtle">·</span>
          <span className="text-coral">{queries} Coral queries</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-fg leading-tight">
          {inc.title}
        </h2>
        <div className="text-sm font-mono text-fg-muted mt-1">
          {inc.service_name || "unknown service"}
        </div>
      </div>

      {/* Root cause */}
      {brief.root_cause && (
        <div className="neumorph-coral p-6">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-coral font-semibold">
              ◆ Root cause
            </div>
            {brief.confidence && (
              <div className="text-[11px] font-mono text-fg-subtle">
                {brief.confidence.toLowerCase()} confidence
              </div>
            )}
          </div>
          <p className="text-base leading-[1.6] text-fg">{brief.root_cause}</p>
          {brief.parse_error && (
            <p className="mt-3 text-[10px] font-mono text-yellow">
              note: Groq returned non-JSON ({brief.parse_error})
            </p>
          )}
        </div>
      )}

      {/* Action grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {brief.recommended_action && (
          <div className="neumorph-raised p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-2">
              Recommended action
            </div>
            <p className="text-sm text-fg font-medium leading-snug">
              {brief.recommended_action}
            </p>
            {brief.rollback_recommended && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-coral">
                <RotateCcw className="size-3" /> rollback recommended
              </div>
            )}
          </div>
        )}

        {brief.suspicious_commit?.sha && (
          <div className="neumorph-raised p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-2">
              Suspect commit
            </div>
            <div className="flex items-center gap-2">
              <code className="text-coral font-mono">
                {brief.suspicious_commit.sha?.slice(0, 7)}
              </code>
              {brief.suspicious_commit.author && (
                <span className="text-[11px] font-mono text-fg-muted">
                  @{brief.suspicious_commit.author}
                </span>
              )}
            </div>
            {brief.suspicious_commit.message && (
              <p className="text-xs text-fg-muted mt-2 line-clamp-2">
                {brief.suspicious_commit.message}
              </p>
            )}
          </div>
        )}

        {brief.blast_radius && (
          <div className="neumorph-raised p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-2">
              Blast radius
            </div>
            <p className="text-xs text-fg leading-relaxed">{brief.blast_radius}</p>
          </div>
        )}

        {brief.who_to_page && brief.who_to_page.length > 0 && (
          <div className="neumorph-raised p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-2">
              Page
            </div>
            <div className="flex flex-col gap-0.5 font-mono text-[12px]">
              {brief.who_to_page.map((p) => (
                <span key={p} className="text-fg">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-coral text-bg rounded-md font-semibold text-sm brutal-shadow-sm brutal-hover">
          <Send className="size-3.5" />
          Post brief to Slack
        </button>
        <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 neumorph-raised text-fg font-semibold text-sm hover:text-coral transition-colors">
          <Ticket className="size-3.5" />
          Create Linear ticket
        </button>
      </div>

      {/* Suspect commits table */}
      {suspectCommits.length > 0 && (
        <div className="neumorph-card p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <GitCommit className="size-3.5 text-coral" />
              Suspect commits
            </h3>
            <span className="text-[10px] font-mono text-fg-subtle">
              {suspectCommits.length} found
            </span>
          </div>
          <div className="neumorph-inset overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_60px_60px] gap-3 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle border-b border-border-muted">
              <span>sha</span>
              <span>message</span>
              <span>author</span>
              <span className="text-right">m before</span>
            </div>
            {suspectCommits.slice(0, 6).map((c, i) => (
              <div
                key={c.sha || i}
                className="grid grid-cols-[80px_1fr_60px_60px] gap-3 px-3 py-2.5 text-[12px] font-mono items-baseline border-b border-border-muted last:border-b-0"
              >
                <code className="text-coral truncate">{c.sha?.slice(0, 7) || "—"}</code>
                <span className="text-fg truncate">{c.message || "—"}</span>
                <span className="text-fg-muted truncate">{c.author || "—"}</span>
                <span className="text-right text-fg-muted tabular-nums">
                  {typeof c.minutes_before_incident === "number"
                    ? c.minutes_before_incident.toFixed(0)
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics + Sentry side-by-side */}
      <div className="grid lg:grid-cols-2 gap-4">
        {metricsDelta.length > 0 && (
          <div className="neumorph-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap className="size-3.5 text-coral" />
              Metric deltas
            </h3>
            <div className="space-y-2.5">
              {metricsDelta.slice(0, 6).map((m, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between text-[12px] font-mono"
                >
                  <span className="text-fg-muted truncate pr-3">
                    {m.metric_name || "metric"}
                  </span>
                  <span className="text-fg shrink-0">
                    <span className="text-fg-subtle">peak </span>
                    <span className="text-coral font-semibold tabular-nums">
                      {m.peak_value ?? "—"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sentryIssues.length > 0 && (
          <div className="neumorph-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <AlertOctagon className="size-3.5 text-red" />
              Sentry errors
            </h3>
            <div className="space-y-3">
              {sentryIssues.slice(0, 4).map((s) => (
                <div key={s.id} className="text-[12px]">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="font-mono text-red">{s.level || "error"}</span>
                    <span className="font-mono text-fg-subtle tabular-nums">
                      ×{s.times_seen ?? 1}
                    </span>
                  </div>
                  <p className="text-fg truncate">{s.title || "—"}</p>
                  {s.culprit && (
                    <p className="text-[11px] font-mono text-fg-muted truncate">
                      {s.culprit}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Linear tickets if present */}
      {linearTickets.length > 0 && (
        <div className="neumorph-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Ticket className="size-3.5 text-coral" />
            Related Linear tickets
          </h3>
          <ul className="space-y-2">
            {linearTickets.slice(0, 4).map((t) => (
              <li
                key={t.id}
                className="flex items-baseline justify-between text-[13px]"
              >
                <span className="text-fg truncate pr-3">{t.title}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-fg-subtle shrink-0">
                  {t.state || "open"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw JSON toggle */}
      <details className="neumorph-card p-4">
        <summary className="cursor-pointer text-[11px] font-mono text-fg-subtle hover:text-fg-muted transition-colors select-none flex items-center gap-2">
          <ArrowUpRight className="size-3" />
          raw response · /api/investigate/{inc.id}
        </summary>
        <pre className="mt-3 neumorph-inset p-3 text-[10px] font-mono leading-relaxed overflow-x-auto text-fg-muted max-h-80">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </motion.div>
  );
}
