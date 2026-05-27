// Architectural side rails — two vertical 1px lines that frame the page content
// at the max-width boundary. Subtle, blueprint-feel; gives every section a
// consistent visual structure. Inspired by Linear, Vercel, and Substack's
// editorial layouts.

export function SideRails() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 flex justify-center"
    >
      <div className="relative w-full max-w-6xl">
        <div className="absolute inset-y-0 left-0 w-px bg-border" />
        <div className="absolute inset-y-0 right-0 w-px bg-border" />
        {/* Faint accent at top of rails — small architectural detail */}
        <div className="absolute top-14 left-0 -translate-x-1/2 size-1 rounded-full bg-coral/40" />
        <div className="absolute top-14 right-0 translate-x-1/2 size-1 rounded-full bg-coral/40" />
      </div>
    </div>
  );
}

// Cross-mark used at section boundaries — small "+" sign at the rail intersections.
// Place inside sections as an absolutely-positioned overlay near top edges.
export function RailCross({ position }: { position: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute top-0 ${position === "left" ? "-left-[3px]" : "-right-[3px]"} -translate-y-1/2 size-1.5 z-20`}
    >
      <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
    </div>
  );
}
