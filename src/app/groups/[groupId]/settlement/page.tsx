import Link from "next/link";
import { Suspense } from "react";
import { SettlementSummary } from "@/components/expenses/settlement-summary";
import { SplitzyMark } from "@/components/splitzy-mark";

export default function SettlementPage({ params }: { params: Promise<{ groupId: string }> }) {
  return <main className="min-h-screen bg-[#fbfaf7] text-[#25251f]"><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7"><Link href="/" className="flex items-center gap-2.5"><SplitzyMark /><span className="text-[1.35rem] font-extrabold tracking-[-0.06em]">splitzy</span></Link><span className="text-sm font-semibold text-[#77766d]">Group settlement</span></header><div className="mx-auto max-w-2xl px-5 pb-16 pt-4 sm:px-8"><Suspense fallback={<p role="status" className="rounded-2xl border border-[#ebe7de] bg-white p-5 text-sm text-[#77766d]">Loading settlement…</p>}><SettlementContent params={params} /></Suspense></div></main>;
}

async function SettlementContent({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <SettlementSummary groupId={groupId} />;
}
