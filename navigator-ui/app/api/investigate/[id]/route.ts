// Server-side proxy to /api/investigate/:id on the backend.
// This is the heavy endpoint — runs 4 Coral queries + Groq. Longer timeout.

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const API_KEY = process.env.BACKEND_API_KEY || "dev-key";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const url = `${BACKEND_URL}/api/investigate/${encodeURIComponent(id)}${qs ? "?" + qs : ""}`;

  try {
    const upstream = await fetch(url, {
      headers: { "x-api-key": API_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: `Backend returned ${upstream.status}`, detail: text.slice(0, 500) },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Backend unreachable",
        message,
        hint: `Start it with: cd navigator-backend && npm run dev (expected at ${BACKEND_URL})`,
      },
      { status: 503 },
    );
  }
}
