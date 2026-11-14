import Link from "next/link";
import { Suspense } from "react";
import { GroupForm } from "@/components/groups/group-form";
import { SplitzyMark } from "@/components/splitzy-mark";
import { GroupExpenseOverview } from "@/components/expenses/group-expense-overview";

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#25251f]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Splitzy home">
          <SplitzyMark />
          <span className="text-[1.35rem] font-extrabold tracking-[-0.06em]">splitzy</span>
        </Link>
        <Link href="/" className="text-sm font-bold text-[#77766d] hover:text-[#d9674b]">Home</Link>
      </header>
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-4 sm:px-8">
        <Link href="/groups" className="mb-5 inline-flex text-sm font-semibold text-[#d9674b] hover:text-[#bb4f36]">← All groups</Link>
        <Suspense fallback={<p role="status" className="rounded-2xl border border-[#ebe7de] bg-white p-5 text-sm text-[#77766d]">Loading group…</p>}>
          <GroupDetail params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function GroupDetail({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <><div className="mb-5 flex flex-wrap gap-3"><Link href={`/groups/${encodeURIComponent(groupId)}/expenses/new`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ed795d] px-4 text-sm font-bold text-white">+ Add expense</Link><Link href={`/groups/${encodeURIComponent(groupId)}/settlement`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#625f56] ring-1 ring-[#ebe7de]">Settlement</Link></div><GroupExpenseOverview groupId={groupId} /><GroupForm groupId={groupId} /></>;
}
