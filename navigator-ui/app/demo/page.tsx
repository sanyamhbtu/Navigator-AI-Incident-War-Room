import { Nav } from "@/components/Nav";
import { Dashboard } from "@/components/Dashboard";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "War room — Reef",
  description:
    "Live incident war room. Real data through the navigator-backend: Coral resolves the JOIN, Groq (Llama 3.3 70B) generates the brief.",
};

export default function DemoPage() {
  return (
    <>
      <Nav />
      <main className="pt-24">
        <Dashboard />
      </main>
      <Footer />
    </>
  );
}
