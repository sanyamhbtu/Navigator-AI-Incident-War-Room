"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowUpRight } from "lucide-react";
import {
  INCIDENTS,
  HERO_BRIEF,
  HERO_COMMITS,
  HERO_METRICS,
  HERO_SENTRY,
  type Incident,
} from "@/lib/mockData";

type Phase = "idle" | "querying" | "analyzing" | "streaming" | "done";

const SOURCES = ["pagerduty", "github", "datadog", "sentry", "slack", "linear"];
const SOURCE_LATENCY = [38, 71, 94, 52, 27, 43];

const SEVERITY_CLS: Record<Incident["severity"], string> = {
  P1: "text-red",
  P2: "text-fg",
  P3: "text-fg-muted",
};

export function LiveDemo() {
  const [selected, setSelected] = useState<Incident | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [streamedChars, setStreamedChars] = useState(0);
  const timerRef = useRef<number | null>(null);

  const fullText = JSON.stringify(HERO_BRIEF, null, 2);

  function startInvestigation(inc: Incident) {
    setSelected(inc);
    setPhase("querying");
    setElapsed(0);
    setStreamedChars(0);
  }

  function reset() {
    setSelected(null);
    setPhase("idle");
    setElapsed(0);
    setStreamedChars(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => {
    if (!selected) return;
    const tick = window.setInterval(() => setElapsed((e) => e + 0.1), 100);
    timerRef.current = tick;
    const transitions: { phase: Phase; ms: number }[] = [
      { phase: "analyzing", ms: 1400 },
      { phase: "streaming", ms: 2800 },
      { phase: "done", ms: 11800 },
    ];
    const timers = transitions.map(({ phase: nextPhase, ms }) =>
      window.setTimeout(() => setPhase(nextPhase), ms),
    );
    return () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
    };
  }, [selected]);

  useEffect(() => {
    if (phase !== "streaming") return;
    let idx = 0;
    const interval = window.setInterval(() => {
      idx += 18;
      setStreamedChars(idx);
      if (idx >= fullText.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [phase, fullText.length]);

  return (
    <section id="demo" className="relative pb-28 sm:pb-36">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-panel/40 border border-border rounded-xl overflow-hidden">
          {/* Top bar — minimal */}
          <div className="border-b border-border px-5 py-3 flex items-center justify-between flex-wrap gap-3 text-[11px] font-mono text-fg-subtle">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-fg-muted uppercase tracking-wider">war room</span>
              <span>·</span>
              <div className="flex items-center gap-1.5">
                {SOURCES.map((s) => (
                  <span key={s}>{s}</span>
                )).reduce<React.ReactNode[]>((acc, el, i) => {
                  if (i > 0) acc.push(<span key={`sep-${i}`} className="text-fg-subtle">·</span>);
                  acc.push(el);
                  return acc;
                }, [])}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {phase === "idle" ? (
                <span>awaiting selection</span>
              ) : (
                <>
                  <span className="text-fg tabular-nums">{elapsed.toFixed(1)}s</span>
                  {selected && (
                    <button
                      onClick={reset}
                      className="text-fg-muted hover:text-fg transition-colors"
                    >
                      reset
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr]">
            {/* Left: incidents list */}
            <div className="border-b lg:border-b-0 lg:border-r border-border p-4 lg:max-h-[680px] lg:overflow-auto">
              <div className="text-[11px] font-mono uppercase tracking-wider text-fg-subtle mb-3 px-1">
                Active · {INCIDENTS.length}
              </div>
              <ul className="space-y-1">
                {INCIDENTS.map((inc) => (
                  <li key={inc.id}>
                    <button
                      onClick={() => startInvestigation(inc)}
                      disabled={phase !== "idle"}
                      className={`w-full text-left p-3 rounded-md border transition-all ${
                        selected?.id === inc.id
                          ? "border-coral/40 bg-coral/[0.04]"
                          : "border-transparent hover:border-border hover:bg-panel"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className={`text-[11px] font-mono font-medium ${SEVERITY_CLS[inc.severity]}`}>
                          {inc.severity}
                        </span>
                        <span className="text-[11px] font-mono text-fg-subtle">
                          {inc.ageMinutes}m
                        </span>
                      </div>
                      <div className="text-sm font-medium leading-snug mb-0.5 text-fg">
                        {inc.title}
                      </div>
                      <div className="text-[11px] font-mono text-fg-subtle">
                        {inc.service}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: investigation */}
            <div className="p-6 sm:p-8 min-h-[680px]">
              <AnimatePresence mode="wait">
                {phase === "idle" && <IdleState key="idle" />}

                {phase !== "idle" && selected && (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <IncidentHeader incident={selected} phase={phase} />

                    {phase === "querying" && <QueryingState />}
                    {phase === "analyzing" && <AnalyzingState />}
                    {(phase === "streaming" || phase === "done") && (
                      <BriefView
                        text={fullText}
                        chars={phase === "done" ? fullText.length : streamedChars}
                        complete={phase === "done"}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Raw context cards — appear only when brief complete */}
        {selected && phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden mt-6"
          >
            <RawCard label="GitHub commits" count={HERO_COMMITS.length}>
              {HERO_COMMITS.slice(0, 3).map((c) => (
                <div key={c.sha} className="text-xs">
                  <span className="font-mono text-coral">{c.sha}</span>{" "}
                  <span className="text-fg-subtle font-mono">{c.author}</span>
                  <div className="text-fg-muted mt-0.5 truncate">{c.message}</div>
                </div>
              ))}
            </RawCard>
            <RawCard label="Datadog metrics" count={HERO_METRICS.length}>
              {HERO_METRICS.map((m) => (
                <div key={m.name} className="text-xs flex items-baseline justify-between gap-3">
                  <span className="font-mono text-fg-muted truncate">{m.name}</span>
                  <span className="font-mono text-coral font-medium shrink-0">{m.spike}</span>
                </div>
              ))}
            </RawCard>
            <RawCard label="Sentry errors" count={HERO_SENTRY.reduce((a, s) => a + s.count, 0)}>
              {HERO_SENTRY.map((s, i) => (
                <div key={i} className="text-xs">
                  <span className="font-mono text-fg-subtle">{s.level}</span>{" "}
                  <span className="text-fg-muted">{s.title}</span>
                </div>
              ))}
            </RawCard>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function IdleState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center text-center min-h-[600px]"
    >
      <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-3">
        Ready
      </div>
      <h3 className="text-xl font-medium mb-2 max-w-sm">
        Select an incident to investigate
      </h3>
      <p className="text-sm text-fg-muted max-w-sm leading-relaxed">
        Reef runs one Coral query, hands the JOINed result to Claude, and
        returns a structured brief in under twelve seconds.
      </p>
    </motion.div>
  );
}

function IncidentHeader({ incident, phase }: { incident: Incident; phase: Phase }) {
  return (
    <div className="flex items-start justify-between gap-4 pb-5 border-b border-border">
      <div className="min-w-0">
        <div className="flex items-baseline gap-3 mb-1.5 text-[11px] font-mono text-fg-subtle">
          <span className={`font-medium ${SEVERITY_CLS[incident.severity]}`}>
            {incident.severity}
          </span>
          <span>{incident.id}</span>
          <span>·</span>
          <span>{incident.triggeredAt}</span>
        </div>
        <h3 className="text-lg font-medium leading-tight truncate text-fg">
          {incident.title}
        </h3>
        <div className="text-xs font-mono text-fg-muted mt-1">{incident.service}</div>
      </div>
      <PhaseLabel phase={phase} />
    </div>
  );
}

function PhaseLabel({ phase }: { phase: Phase }) {
  const labels: Record<Phase, string> = {
    idle: "idle",
    querying: "querying coral",
    analyzing: "claude analyzing",
    streaming: "streaming brief",
    done: "complete",
  };
  const isActive = phase !== "idle" && phase !== "done";
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-fg-muted shrink-0">
      {isActive && <Loader2 className="size-3 animate-spin text-coral" />}
      <span className={phase === "done" ? "text-coral" : ""}>{labels[phase]}</span>
    </div>
  );
}

function QueryingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg p-5"
    >
      <div className="text-[11px] font-mono text-fg-subtle mb-4">
        coral sql · joining 6 sources
      </div>
      <div className="space-y-1.5">
        {SOURCES.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center justify-between text-xs font-mono"
          >
            <span className="text-fg-muted">{s}</span>
            <span className="text-fg-subtle">
              <span className="text-fg">joined</span> · {SOURCE_LATENCY[i]}ms
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function AnalyzingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg p-5"
    >
      <div className="text-[11px] font-mono text-fg-subtle mb-4">
        claude-sonnet-4-6 · prompt cached · structured json
      </div>
      <div className="space-y-2">
        <div className="h-1.5 bg-coral/15 rounded animate-pulse" style={{ width: "94%" }} />
        <div className="h-1.5 bg-coral/15 rounded animate-pulse" style={{ width: "78%" }} />
        <div className="h-1.5 bg-coral/15 rounded animate-pulse" style={{ width: "88%" }} />
        <div className="h-1.5 bg-coral/10 rounded animate-pulse" style={{ width: "62%" }} />
      </div>
    </motion.div>
  );
}

function BriefView({
  text,
  chars,
  complete,
}: {
  text: string;
  chars: number;
  complete: boolean;
}) {
  const brief = HERO_BRIEF;

  return (
    <div className="space-y-5">
      {/* Root cause — restrained, no gradient backdrop */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-l-2 border-coral pl-5 py-1"
      >
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-coral">
            Root cause
          </div>
          <div className="text-[11px] font-mono text-fg-subtle">
            confidence: {brief.confidence.toLowerCase()}
          </div>
        </div>
        <p className="text-[15px] leading-[1.6] text-fg">{brief.root_cause}</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
        <Field label="Suspect commit">
          <div className="flex items-baseline gap-2 mb-1">
            <code className="text-coral font-mono text-sm">{brief.suspicious_commit.sha}</code>
            <span className="text-xs font-mono text-fg-subtle">{brief.suspicious_commit.author}</span>
          </div>
          <p className="text-xs text-fg-muted">{brief.suspicious_commit.message}</p>
        </Field>
        <Field label="Blast radius">
          <p className="text-xs text-fg leading-relaxed">{brief.blast_radius}</p>
        </Field>
        <Field label="Recommended action">
          <p className="text-sm text-fg font-medium mb-1.5">{brief.recommended_action}</p>
          {brief.rollback_recommended && (
            <div className="text-[11px] font-mono text-coral">rollback recommended</div>
          )}
        </Field>
        <Field label="Page">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {brief.who_to_page.map((p) => (
              <span key={p} className="text-xs font-mono text-fg">
                {p}
              </span>
            ))}
          </div>
        </Field>
      </div>

      {complete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-stretch gap-3 pt-2"
        >
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-fg text-bg rounded-md font-medium text-sm hover:bg-fg/90 transition-colors">
            Post to #incidents
            <ArrowUpRight className="size-3.5" />
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-md font-medium text-sm hover:bg-panel transition-colors">
            Create Linear ticket
            <ArrowUpRight className="size-3.5" />
          </button>
        </motion.div>
      )}

      <details className="group">
        <summary className="cursor-pointer text-[11px] font-mono text-fg-subtle hover:text-fg-muted transition-colors select-none">
          view raw JSON · /api/investigate/:id
        </summary>
        <pre className="mt-3 bg-panel border border-border rounded-md p-3 text-[11px] font-mono leading-relaxed overflow-x-auto text-fg-muted">
          {text.slice(0, chars)}
          {!complete && (
            <span className="inline-block w-1 h-3 bg-coral align-middle animate-pulse" />
          )}
        </pre>
      </details>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg p-5">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function RawCard({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle">
          {label}
        </div>
        <div className="text-[10px] font-mono text-fg-subtle tabular-nums">{count}</div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
