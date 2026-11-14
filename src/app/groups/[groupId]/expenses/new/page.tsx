import Link from "next/link";
import { Suspense } from "react";
import { Camera, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default function NewExpensePage({ params }: { params: Promise<{ groupId: string }> }) {
  return <AppShell title="Add expense" description="Enter what was shared and review every part of the total." active="groups" action={<Link href="/scan" className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-foreground hover:bg-surface-muted"><Camera size={16} aria-hidden="true" /><span>Scan receipt</span></Link>}>
    <Suspense fallback={<div role="status" className="animate-pulse rounded-2xl border border-border bg-white p-6"><span className="block h-4 w-24 rounded bg-surface-muted" /><span className="mt-4 block h-8 w-1/2 rounded bg-surface-muted" /><span className="mt-7 block h-24 rounded-xl bg-surface-muted" /></div>}><NewExpenseContent params={params} /></Suspense>
  </AppShell>;
}

async function NewExpenseContent({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <><Link href={`/groups/${encodeURIComponent(groupId)}`} className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"><ChevronLeft size={16} aria-hidden="true" />Back to group</Link><ExpenseForm groupId={groupId} /></>;
}
