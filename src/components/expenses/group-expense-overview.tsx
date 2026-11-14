"use client";

import Link from "next/link";
import { useSavedGroups } from "@/components/groups/use-saved-groups";
import { useGroupExpenses } from "@/components/expenses/use-group-expenses";
import { formatCents, getExpenseSubtotalCents } from "@/lib/expenses/calculations";

export function GroupExpenseOverview({ groupId }: { groupId: string }) {
  const { groups } = useSavedGroups();
  const group = groups.find((entry) => entry.group.id === groupId);
  const store = useGroupExpenses(groupId, group?.members ?? []);
  if (store.loading) return <p role="status" className="mb-5 rounded-2xl border border-[#ebe7de] bg-white p-4 text-sm text-[#77766d]">Loading saved expenses…</p>;
  return <section className="mb-5 rounded-2xl border border-[#ebe7de] bg-white p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Expenses</h2><p className="mt-1 text-xs text-[#77766d]">{store.signedIn ? "Cloud-synced records" : "Guest records saved on this device"}</p></div><Link href={`/groups/${encodeURIComponent(groupId)}/settlement`} className="shrink-0 text-sm font-bold text-[#d9674b]">View settlement →</Link></div>
    {store.error && <p role="alert" className="mt-3 rounded-xl bg-[#fff1ee] p-3 text-sm text-[#a64531]">{store.error}</p>}
    {!store.error && store.expenses.length === 0 && <p className="mt-3 text-sm text-[#88867d]">No expenses saved for this group yet.</p>}
    {store.expenses.length > 0 && <ul className="mt-3 divide-y divide-[#eeeae2]">{store.expenses.slice(0, 3).map((expense) => <li key={expense.id} className="flex justify-between gap-3 py-2 text-sm"><span className="truncate">{expense.description}</span><span className="shrink-0 font-semibold">{formatCents(getExpenseSubtotalCents(expense) + expense.taxCents + expense.tipCents)}</span></li>)}</ul>}
    {store.signedIn && store.offlineExpenses.length > 0 && <p className="mt-3 rounded-lg bg-[#fff7e6] px-3 py-2 text-xs text-[#725a2b]">{store.offlineExpenses.length} browser expense{store.offlineExpenses.length === 1 ? "" : "s"} not synced. Review and import from Settlement.</p>}
  </section>;
}
