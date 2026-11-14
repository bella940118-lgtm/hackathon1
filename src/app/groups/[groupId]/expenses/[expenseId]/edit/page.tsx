import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default function EditExpensePage({ params, searchParams }: { params: Promise<{ groupId: string; expenseId: string }>; searchParams: Promise<{ offline?: string }> }) {
  return <AppShell title="Edit expense" description="Update the receipt details and review each person’s share." active="groups">
    <Suspense fallback={<p role="status" className="rounded-2xl border border-border bg-white p-5 text-sm text-muted">Loading expense…</p>}><EditExpenseContent params={params} searchParams={searchParams} /></Suspense>
  </AppShell>;
}

async function EditExpenseContent({ params, searchParams }: { params: Promise<{ groupId: string; expenseId: string }>; searchParams: Promise<{ offline?: string }> }) {
  const [{ groupId, expenseId }, query] = await Promise.all([params, searchParams]);
  const offline = query.offline === "true";
  return <><Link href={`/groups/${encodeURIComponent(groupId)}`} className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"><ChevronLeft size={16} aria-hidden="true" />Back to group</Link><ExpenseForm groupId={groupId} expenseId={expenseId} offline={offline} /></>;
}
