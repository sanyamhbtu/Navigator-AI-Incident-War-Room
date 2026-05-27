"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitHubIcon } from "./icons/GitHubIcon";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-bg/80 backdrop-blur-xl border-b border-border"
          : "border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg">🪸</span>
          <span className="font-semibold text-sm tracking-tight">Reef</span>
        </Link>

        <div className="flex items-center gap-1">
          <NavLink href="#how">How it works</NavLink>
          <NavLink href="#stack">Stack</NavLink>
          <NavLink href="/demo">Demo</NavLink>
          <a
            href="https://github.com/sanyamhbtu/navigator-backend"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 size-9 flex items-center justify-center text-fg-muted hover:text-fg transition-colors rounded-md hover:bg-panel"
            aria-label="GitHub"
          >
            <GitHubIcon className="size-4" />
          </a>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm text-fg-muted hover:text-fg transition-colors rounded-md hover:bg-panel"
    >
      {children}
    </Link>
  );
}
