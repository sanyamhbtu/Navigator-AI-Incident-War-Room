// Server-side proxy to the navigator-backend /api/incidents endpoint.
// Holds the x-api-key here so it never reaches the client bundle.

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
const API_KEY = process.env.BACKEND_API_KEY || "dev-key";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const url = `${BACKEND_URL}/api/incidents${qs ? "?" + qs : ""}`;

  try {
    const upstream = await fetch(url, {
      headers: { "x-api-key": API_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Backend returned ${upstream.status}`, status: upstream.status },
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
