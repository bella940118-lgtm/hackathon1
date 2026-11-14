"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, Check, CircleDollarSign, Plus, ScanLine, Trash2 } from "lucide-react";
import { useSavedGroups } from "@/components/groups/use-saved-groups";
import { useGroupExpenses, type ExpenseStorageMode } from "@/components/expenses/use-group-expenses";
import { calculateExpenseShares, formatCents, getExpenseSubtotalCents, parseMoneyToCents } from "@/lib/expenses/calculations";
import { getUnassignedItems } from "@/lib/expenses/assignments";
import type { ExpenseRecord } from "@/lib/expenses/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface DraftItem { id: string; name: string; quantity: string; unitPrice: string; assignedMemberIds: string[]; memberSharesCents?: Record<string, number>; }
const blankItem = (): DraftItem => ({ id: "new-item-1", name: "", quantity: "1", unitPrice: "", assignedMemberIds: [] });
const moneyValue = (value: string) => value.trim() === "" ? 0 : parseMoneyToCents(value);
const centsInput = (amount: number) => `${Math.floor(amount / 100)}.${String(amount % 100).padStart(2, "0")}`;

export function ExpenseForm({ groupId, expenseId, offline = false }: { groupId: string; expenseId?: string; offline?: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { groups, loading, storageError } = useSavedGroups();
  const saved = groups.find((entry) => entry.group.id === groupId);
  const expenseStore = useGroupExpenses(groupId, saved?.members ?? []);
  const [description, setDescription] = useState("");
  const [paidByMemberId, setPaidByMemberId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([blankItem()]);
  const [tax, setTax] = useState("");
  const [tip, setTip] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingOfflineExpense, setPendingOfflineExpense] = useState<ExpenseRecord | null>(null);
  const [editReady, setEditReady] = useState(!expenseId);
  const [editMissing, setEditMissing] = useState(false);

  const editRecord = expenseId
    ? offline || !expenseStore.signedIn
      ? expenseStore.signedIn ? expenseStore.offlineExpenses.find((entry) => entry.id === expenseId) : expenseStore.expenses.find((entry) => entry.id === expenseId)
      : expenseStore.expenses.find((entry) => entry.id === expenseId)
    : undefined;

  useEffect(() => {
    if (!expenseId || loading || expenseStore.loading) return;
    if (!editRecord) { setEditMissing(true); setEditReady(true); return; }
    setDescription(editRecord.description);
    setPaidByMemberId(editRecord.paidByMemberId);
    setTax(centsInput(editRecord.taxCents));
    setTip(centsInput(editRecord.tipCents));
    setItems(editRecord.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: String(item.quantity),
      unitPrice: centsInput(item.unitPriceCents),
      assignedMemberIds: item.assignedMemberIds,
      memberSharesCents: item.memberSharesCents,
    })));
    setEditReady(true);
  }, [editRecord, expenseId, expenseStore.loading, loading]);

  useEffect(() => {
    if (!paidByMemberId && saved?.members[0]) setPaidByMemberId(saved.members[0].id);
  }, [paidByMemberId, saved]);

  const parsedItems = useMemo(() => items.map((item) => ({
    draft: item,
    price: parseMoneyToCents(item.unitPrice),
    quantity: Number(item.quantity),
  })), [items]);
  const subtotalCents = parsedItems.reduce((sum, item) => sum + (item.price ?? 0) * (Number.isInteger(item.quantity) ? item.quantity : 0), 0);
  const taxCents = moneyValue(tax);
  const tipCents = moneyValue(tip);
  const memberIds = saved?.members.map((member) => member.id) ?? [];
  const unassignedItems = getUnassignedItems(items, memberIds);
  const unassignedItemIds = new Set(unassignedItems.map((item) => item.id));
  const preview = useMemo(() => {
    if (!saved || !description.trim() || parsedItems.some(({ draft, price, quantity }) => !draft.name.trim() || price === null || price < 0 || !Number.isInteger(quantity) || quantity < 1 || draft.assignedMemberIds.length === 0) || taxCents === null || tipCents === null) return null;
    const draft: ExpenseRecord = { id: "preview", groupId, description, paidByMemberId: paidByMemberId || saved.members[0]?.id || "", items: parsedItems.map(({ draft: item, price, quantity }) => ({ id: item.id, name: item.name.trim(), quantity, unitPriceCents: price!, assignedMemberIds: item.assignedMemberIds, memberSharesCents: item.memberSharesCents })), taxCents, tipCents, createdAt: "" };
    try { return calculateExpenseShares(draft, saved.members.map((member) => member.id)); } catch { return null; }
  }, [description, groupId, paidByMemberId, parsedItems, saved, taxCents, tipCents]);

  function updateItem(itemId: string, update: Partial<DraftItem>) {
    setItems((current) => current.map((item) => {
      if (item.id !== itemId) return item;
      const updated = { ...item, ...update };
      delete updated.memberSharesCents;
      return updated;
    }));
  }

  function toggleMember(item: DraftItem, memberId: string) {
    const ids = item.assignedMemberIds.includes(memberId) ? item.assignedMemberIds.filter((id) => id !== memberId) : [...item.assignedMemberIds, memberId];
    updateItem(item.id, { assignedMemberIds: ids });
  }

  function scrollToFirstUnassignedItem() {
    const firstItem = unassignedItems[0];
    if (!firstItem) return false;
    const assignmentFieldset = document.getElementById(`item-assignees-${firstItem.id}`);
    assignmentFieldset?.scrollIntoView({ behavior: "smooth", block: "center" });
    assignmentFieldset?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus({ preventScroll: true });
    return true;
  }

  function continueToSettlement() {
    if (scrollToFirstUnassignedItem()) return;
    formRef.current?.requestSubmit();
  }

  async function persist(expense: ExpenseRecord, target: ExpenseStorageMode) {
    setSaving(true);
    setError(null);
    try {
      await expenseStore.save(expense, target);
      router.push(`/groups/${encodeURIComponent(groupId)}/settlement`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Expense could not be saved.");
      if (target === "cloud") setPendingOfflineExpense(expense);
    } finally { setSaving(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saved) return;
    setError(null);
    if (!description.trim()) return setError("Enter a merchant or expense name.");
    if (!paidByMemberId) return setError("Choose who paid for this expense.");
    if (items.length === 0) return setError("Add at least one item.");
    const normalized = parsedItems.map(({ draft, price, quantity }) => ({ draft, price, quantity }));
    if (normalized.some(({ draft, price, quantity }) => !draft.name.trim() || price === null || price < 0 || !Number.isInteger(quantity) || quantity < 1)) return setError("Check each item name, quantity, and price.");
    if (getUnassignedItems(normalized.map(({ draft }) => draft), memberIds).length > 0) {
      scrollToFirstUnassignedItem();
      return;
    }
    if (taxCents === null || tipCents === null) return setError("Enter tax and tip as dollar amounts with up to two decimal places.");
    if (taxCents + tipCents > 0 && subtotalCents === 0) return setError("Add an item with a price before adding tax or tip.");
    if (!Number.isSafeInteger(subtotalCents + taxCents + tipCents)) return setError("This expense total is too large to calculate safely.");
    if (normalized.some(({ price, quantity }) => !Number.isSafeInteger(price! * quantity))) return setError("An item total is too large to calculate safely.");

    const expense: ExpenseRecord = {
      id: expenseId ?? crypto.randomUUID(), groupId, description: description.trim(), paidByMemberId,
      items: normalized.map(({ draft, price, quantity }) => ({ id: draft.id.startsWith("new-item") ? crypto.randomUUID() : draft.id, name: draft.name.trim(), quantity, unitPriceCents: price!, assignedMemberIds: draft.assignedMemberIds, memberSharesCents: draft.memberSharesCents })),
      taxCents, tipCents, createdAt: editRecord?.createdAt ?? new Date().toISOString(),
    };
    const target: ExpenseStorageMode = expenseStore.signedIn ? (offline ? "offline" : "cloud") : "guest";
    await persist(expense, target);
  }

  if (loading || expenseStore.loading || !editReady) return <p role="status" className="rounded-2xl border border-[#ebe7de] bg-white p-5 text-sm text-[#77766d]">Loading {expenseId ? "expense" : "group"}…</p>;
  if (!saved) return <section className="rounded-3xl border border-[#ebe7de] bg-white p-6"><h1 className="text-xl font-bold">Group not found</h1><p className="mt-2 text-sm text-[#77766d]">Load the group in this browser or wait for cloud access to return.</p><Link className="mt-4 inline-flex font-bold text-[#d9674b]" href="/">Back home →</Link></section>;
  if (editMissing) return <section className="rounded-3xl border border-[#ebe7de] bg-white p-6"><h1 className="text-xl font-bold">Expense not found</h1><p role={expenseStore.error ? "alert" : "status"} className="mt-2 text-sm text-[#77766d]">{expenseStore.error ?? "It may have been deleted or belongs to a different storage mode."}</p><Link className="mt-4 inline-flex font-bold text-[#d9674b]" href={`/groups/${encodeURIComponent(groupId)}/settlement`}>Back to settlement →</Link></section>;

  return <form ref={formRef} onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1ed] pb-5">
          <div><Badge tone="green">{saved.group.name}</Badge><h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">{expenseId ? "Review expense" : "Add an expense"}</h2><p className="mt-1 max-w-xl text-sm leading-5 text-muted">Enter the receipt details. You’ll review each person’s share before you save.</p></div>
          <Link href="/scan" className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground hover:bg-surface-muted"><ScanLine size={15} aria-hidden="true" />Scan instead</Link>
        </div>

        {!expenseStore.signedIn && <p role="status" className="mt-4 rounded-xl border border-[#eadbb7] bg-warning-soft px-3.5 py-3 text-sm leading-5 text-[#75511e]">Guest mode · this expense stays in this browser and won’t sync to another device.</p>}
        {expenseStore.signedIn && offline && <p role="status" className="mt-4 rounded-xl border border-[#eadbb7] bg-warning-soft px-3.5 py-3 text-sm leading-5 text-[#75511e]">Offline copy · changes stay in this browser until you choose to import them.</p>}
        {(storageError || expenseStore.error) && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-[#f0d3cd] bg-danger-soft px-3.5 py-3 text-sm leading-5 text-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{expenseStore.error ?? storageError}</p>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label htmlFor="expense-description" className="mb-1.5 block text-sm font-semibold">Merchant or expense name</label><Input id="expense-description" required maxLength={80} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Dinner at Sunroom" autoComplete="off" /></div>
          <div><label htmlFor="paid-by" className="mb-1.5 block text-sm font-semibold">Paid by</label><select id="paid-by" value={paidByMemberId} onChange={(event) => setPaidByMemberId(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm shadow-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">{saved.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></div>
          <div className="flex items-end"><p className="text-xs leading-5 text-muted">The payer covers the full receipt upfront. The split below shows how the group shares it.</p></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf1ed] px-5 py-4 sm:px-6">
          <div><h3 className="text-base font-semibold">Items</h3><p className="mt-0.5 text-xs text-muted">Choose who shared each item.</p></div>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, { ...blankItem(), id: crypto.randomUUID() }])}><Plus size={15} aria-hidden="true" />Add item</Button>
        </div>
        <div className="divide-y divide-[#edf1ed]">
          {items.map((item, index) => {
            const needsAssignment = unassignedItemIds.has(item.id);
            return <article key={item.id} className={`p-4 sm:p-5 ${needsAssignment ? "bg-[#fff9f7]" : "bg-white"}`}>
              <div className="mb-3 flex items-center justify-between gap-3"><h4 className="text-sm font-semibold">Item {index + 1}</h4>{items.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="min-h-8 px-2 text-muted hover:bg-danger-soft hover:text-danger"><Trash2 size={14} aria-hidden="true" />Remove</Button>}</div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_104px_138px]">
                <div><label className="mb-1.5 block text-xs font-semibold text-muted" htmlFor={`item-name-${item.id}`}>Item name</label><Input id={`item-name-${item.id}`} required maxLength={80} value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value })} placeholder="Product or dish" className={needsAssignment ? "border-[#e8b1a5]" : ""} /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-muted" htmlFor={`qty-${item.id}`}>Qty</label><Input id={`qty-${item.id}`} type="number" min="1" max="999" step="1" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} inputMode="numeric" /></div>
                <div><label className="mb-1.5 block text-xs font-semibold text-muted" htmlFor={`price-${item.id}`}>Price each · USD</label><Input id={`price-${item.id}`} inputMode="decimal" value={item.unitPrice} onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })} placeholder="0.00" /></div>
              </div>
              <fieldset id={`item-assignees-${item.id}`} aria-invalid={needsAssignment} aria-describedby={needsAssignment ? `item-assignment-warning-${item.id}` : undefined} className="mt-4">
                <legend className="mb-2 text-xs font-semibold text-muted">Shared by</legend>
                <div className="flex flex-wrap gap-2">{saved.members.map((member) => { const selected = item.assignedMemberIds.includes(member.id); return <label key={member.id} className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors focus-within:ring-4 focus-within:ring-primary/10 ${selected ? "border-[#b8d0bf] bg-[#eaf1ec] text-primary" : "border-border bg-white text-muted hover:bg-surface-muted"}`}><input type="checkbox" checked={selected} onChange={() => toggleMember(item, member.id)} className="sr-only" /><span aria-hidden="true" className={`grid h-4 w-4 place-items-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-[#b6c1b9] bg-white"}`}>{selected && <Check size={11} strokeWidth={3} />}</span>{member.name}</label>; })}</div>
                {needsAssignment && <p id={`item-assignment-warning-${item.id}`} role="alert" className="mt-3 flex items-center gap-2 text-xs font-semibold text-danger"><AlertCircle size={15} aria-hidden="true" />Please select at least one person to split this item.</p>}
              </fieldset>
            </article>;
          })}
        </div>
      </Card>
    </div>

    <aside className="space-y-4 lg:sticky lg:top-6">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2"><CircleDollarSign size={18} className="text-primary" aria-hidden="true" /><h3 className="text-base font-semibold">Tax and tip</h3></div>
        <p className="mt-1 text-xs leading-5 text-muted">Shared in proportion to each person’s item subtotal.</p>
        <div className="mt-4 grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-xs font-semibold text-muted" htmlFor="expense-tax">Tax · USD</label><Input id="expense-tax" inputMode="decimal" value={tax} onChange={(event) => setTax(event.target.value)} placeholder="0.00" /></div><div><label className="mb-1.5 block text-xs font-semibold text-muted" htmlFor="expense-tip">Tip · USD</label><Input id="expense-tip" inputMode="decimal" value={tip} onChange={(event) => setTip(event.target.value)} placeholder="0.00" /></div></div>
        <div className="mt-5 rounded-xl bg-[#f7f9f6] p-4 text-sm">
          <div className="flex justify-between text-muted"><span>Items subtotal</span><span>{formatCents(subtotalCents)}</span></div>
          <div className="mt-2 flex justify-between text-muted"><span>Tax</span><span>{formatCents(taxCents ?? 0)}</span></div>
          <div className="mt-2 flex justify-between text-muted"><span>Tip</span><span>{formatCents(tipCents ?? 0)}</span></div>
          <div className="my-3 border-t border-border" />
          <div className="flex items-baseline justify-between"><span className="font-semibold">Receipt total</span><strong className="text-xl font-semibold tracking-[-0.04em]">{formatCents(subtotalCents + (taxCents ?? 0) + (tipCents ?? 0))}</strong></div>
          {preview ? <div className="mt-4 border-t border-border pt-3"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Each person’s share</p>{saved.members.map((member) => <div key={member.id} className="flex justify-between py-1 text-sm"><span>{member.name}</span><span className="font-semibold">{formatCents(preview.get(member.id) ?? 0)}</span></div>)}</div> : <p className="mt-3 text-xs leading-5 text-muted">Select people for each item to see the per-person split.</p>}
        </div>
      </Card>

      {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-[#f0d3cd] bg-danger-soft p-3 text-sm leading-5 text-danger"><AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}
      <Card className="p-4">
        <Button type="button" onClick={continueToSettlement} disabled={saving} size="lg" className="w-full">{saving ? "Saving expense…" : expenseStore.signedIn && !offline ? "Save to cloud & continue" : "Save & continue"}<ArrowRight size={16} aria-hidden="true" /></Button>
        <p className="mt-2 text-center text-[11px] leading-4 text-muted">You can review the final shares before settling.</p>
        <div className="mt-3 flex flex-col gap-1 border-t border-[#edf1ed] pt-3">
          <Link href={`/groups/${encodeURIComponent(groupId)}/settlement`} className="inline-flex min-h-9 items-center justify-center rounded-lg text-xs font-semibold text-muted hover:bg-surface-muted">Cancel</Link>
        </div>
      </Card>

      {pendingOfflineExpense && <p role="alert" className="rounded-xl border border-[#eadbb7] bg-warning-soft p-4 text-sm leading-5 text-[#75511e]">Cloud save failed; the cloud copy was not changed. <button type="button" disabled={saving} onClick={() => void persist(pendingOfflineExpense, "offline")} className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#e2d4b2] bg-white px-3 text-xs font-semibold text-[#75511e] disabled:opacity-60">Save an offline copy<ArrowRight size={13} aria-hidden="true" /></button></p>}
    </aside>
  </form>;
}
