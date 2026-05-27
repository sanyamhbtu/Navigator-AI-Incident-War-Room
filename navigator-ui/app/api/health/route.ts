// Lightweight health check — used by the dashboard to detect if the
// backend is reachable before the user clicks an incident.

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const upstream = await fetch(`${BACKEND_URL}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ ok: false, status: upstream.status }, { status: 200 });
    }
    return NextResponse.json({ ok: true, backend: BACKEND_URL });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        backend: BACKEND_URL,
        hint: "Run: cd navigator-backend && npm run dev",
      },
      { status: 200 },
    );
  }
}
