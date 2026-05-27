"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const QUERY_LINES: { tokens: { text: string; cls: string }[] }[] = [
  { tokens: [{ text: "SELECT", cls: "text-coral" }] },
  { tokens: [{ text: "  i.title, i.severity, i.created_at,", cls: "text-white" }] },
  { tokens: [{ text: "  c.sha, c.author, m.metric_name, m.value,", cls: "text-white" }] },
  { tokens: [{ text: "  s.text, se.title, l.title", cls: "text-white" }] },
  { tokens: [
    { text: "FROM ", cls: "text-coral" },
    { text: "pagerduty.incidents", cls: "text-white" },
    { text: " i", cls: "text-zinc-400" },
  ]},
  { tokens: [
    { text: "LEFT JOIN ", cls: "text-coral" },
    { text: "github.commits", cls: "text-white" },
    { text: " c ", cls: "text-zinc-400" },
    { text: "ON ", cls: "text-coral" },
    { text: "c.pushed_at ", cls: "text-white" },
    { text: "BETWEEN ", cls: "text-coral" },
    { text: "i.created_at - ", cls: "text-white" },
    { text: "INTERVAL ", cls: "text-coral" },
    { text: "'4h'", cls: "text-zinc-400" },
  ]},
  { tokens: [
    { text: "LEFT JOIN ", cls: "text-coral" },
    { text: "datadog.metrics", cls: "text-white" },
    { text: " m ", cls: "text-zinc-400" },
    { text: "ON ", cls: "text-coral" },
    { text: "m.timestamp ", cls: "text-white" },
    { text: "BETWEEN ", cls: "text-coral" },
    { text: "i.created_at ± ", cls: "text-white" },
    { text: "INTERVAL ", cls: "text-coral" },
    { text: "'30m'", cls: "text-zinc-400" },
  ]},
  { tokens: [
    { text: "LEFT JOIN ", cls: "text-coral" },
    { text: "slack.messages", cls: "text-white" },
    { text: " s ", cls: "text-zinc-400" },
    { text: "ON ", cls: "text-coral" },
    { text: "s.channel = i.slack_channel_id", cls: "text-white" },
  ]},
  { tokens: [
    { text: "LEFT JOIN ", cls: "text-coral" },
    { text: "sentry.issues", cls: "text-white" },
    { text: " se ", cls: "text-zinc-400" },
    { text: "ON ", cls: "text-coral" },
    { text: "se.project = i.service_name", cls: "text-white" },
  ]},
  { tokens: [
    { text: "LEFT JOIN ", cls: "text-coral" },
    { text: "linear.issues", cls: "text-white" },
    { text: " l ", cls: "text-zinc-400" },
    { text: "ON ", cls: "text-coral" },
    { text: "l.title ", cls: "text-white" },
    { text: "ILIKE ", cls: "text-coral" },
    { text: "'%' || i.service_name || '%'", cls: "text-zinc-400" },
  ]},
  { tokens: [
    { text: "WHERE ", cls: "text-coral" },
    { text: "i.id = ", cls: "text-white" },
    { text: "'INC-042'", cls: "text-zinc-400" },
  ]},
];

export function AnimatedSQL() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visibleLines < QUERY_LINES.length) {
      timer = setTimeout(() => setVisibleLines((n) => n + 1), 200);
    } else if (!showResult) {
      timer = setTimeout(() => setShowResult(true), 500);
    } else {
      timer = setTimeout(() => {
        setShowResult(false);
        setVisibleLines(0);
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [visibleLines, showResult]);

  return (
    <div className="relative bg-zinc-950 rounded-md overflow-hidden border-[3px] border-border brutal-shadow-lg">
      {/* Header bar — bright */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b-[2.5px] border-border bg-yellow">
        <span className="text-[11px] font-black uppercase tracking-wider text-fg">
          master_incident_query.sql
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-fg">coral</span>
      </div>

      {/* Code body */}
      <div className="px-5 sm:px-6 py-5 font-mono text-[13px] leading-[1.85] min-h-[300px]">
        {QUERY_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="whitespace-pre overflow-x-auto"
          >
            {line.tokens.map((tok, j) => (
              <span key={j} className={tok.cls}>
                {tok.text}
              </span>
            ))}
          </motion.div>
        ))}
        {visibleLines < QUERY_LINES.length && (
          <span className="inline-block w-1.5 h-3.5 bg-coral align-middle animate-pulse" />
        )}
      </div>

      {/* Result strip */}
      <div className="border-t-[2.5px] border-border bg-coral px-5 py-3 flex items-center justify-between text-[11px] font-black text-fg uppercase tracking-wider">
        {showResult ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            ✓ 6 sources joined · 1 row · 0.42s
          </motion.span>
        ) : (
          <span>running...</span>
        )}
        <span>cache &lt; 0.1× cost</span>
      </div>
    </div>
  );
}
