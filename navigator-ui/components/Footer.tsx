import { GitHubIcon } from "./icons/GitHubIcon";

// Coral-style footer: minimal text columns + a line-art coral illustration
// on the right. The illustration is the closing brand moment.

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div>
          <div className="grid sm:grid-cols-[auto_1fr_1fr] gap-10 lg:gap-16">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🪸</span>
                <span className="font-semibold text-sm">Reef</span>
              </div>
              <p className="text-xs text-fg-subtle leading-relaxed max-w-[200px]">
                Built for the Coral Hackathon 2026 · Enterprise Agent track.
              </p>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-3">
                Project
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://github.com/sanyamhbtu/navigator-backend"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg transition-colors"
                  >
                    <GitHubIcon className="size-3.5" />
                    Source
                  </a>
                </li>
                <li>
                  <a href="/demo" className="text-fg-muted hover:text-fg transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#how" className="text-fg-muted hover:text-fg transition-colors">
                    Architecture
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-3">
                Sponsors
              </div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://withcoral.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg-muted hover:text-fg transition-colors"
                  >
                    Coral
                  </a>
                </li>
                <li>
                  <a
                    href="https://groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fg-muted hover:text-fg transition-colors"
                  >
                    Groq
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-border-muted text-[11px] font-mono text-fg-subtle flex flex-col sm:flex-row gap-2 justify-between">
          <span>© 2026 Reef</span>
          <span>Find the culprit before dawn.</span>
        </div>
      </div>
    </footer>
  );
}

