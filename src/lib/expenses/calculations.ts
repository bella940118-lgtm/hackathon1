import type { ExpenseRecord } from "@/lib/expenses/types";

export interface SettlementMember { id: string; name: string; }
export interface Transfer { fromMemberId: string; toMemberId: string; amountCents: number; }

/** Parses a non-negative decimal currency value without floating point math. */
export function parseMoneyToCents(value: string): number | null {
  const normalized = value.trim().replace(/^\$/, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  const dollars = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const total = dollars * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function splitEvenly(amountCents: number, memberIds: string[]) {
  const share = Math.floor(amountCents / memberIds.length);
  let remainder = amountCents % memberIds.length;
  const portions = new Map<string, number>();
  for (const id of memberIds) {
    const extra = remainder > 0 ? 1 : 0;
    portions.set(id, share + extra);
    remainder -= extra;
  }
  return portions;
}

/** Calculates one item's base shares in stable group-member order. */
export function calculateItemSharesCents(item: ExpenseRecord["items"][number], memberIds: string[]) {
  const orderedIds = [...new Set(memberIds)];
  if (!item.name.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0) {
    throw new Error("Expense contains an invalid item.");
  }
  const lineTotal = item.quantity * item.unitPriceCents;
  if (!Number.isSafeInteger(lineTotal)) throw new Error("Expense item total exceeds the supported range.");
  const selected = orderedIds.filter((id) => item.assignedMemberIds.includes(id));
  if (selected.length === 0) throw new Error(`Assign “${item.name}” to at least one member.`);

  if (item.memberSharesCents) {
    const shares = new Map<string, number>();
    for (const id of selected) {
      const cents = item.memberSharesCents[id];
      if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("Stored item shares are invalid.");
      shares.set(id, cents);
    }
    const sum = [...shares.values()].reduce((total, cents) => total + cents, 0);
    if (Object.keys(item.memberSharesCents).length !== selected.length || sum !== lineTotal) throw new Error("Stored item shares do not match the item total.");
    return shares;
  }
  return splitEvenly(lineTotal, selected);
}

/** Proportional largest-remainder allocation; ties follow the supplied member order. */
function allocateProportionally(amountCents: number, weights: Map<string, number>, memberIds: string[]) {
  const weightTotal = memberIds.reduce((sum, id) => sum + (weights.get(id) ?? 0), 0);
  if (!Number.isSafeInteger(weightTotal)) throw new Error("Expense subtotal exceeds the supported range.");
  const allocations = new Map(memberIds.map((id) => [id, 0]));
  if (amountCents === 0 || weightTotal === 0) return allocations;

  let allocated = 0;
  const remainders = memberIds.map((id, index) => {
    const numerator = BigInt(amountCents) * BigInt(weights.get(id) ?? 0);
    const denominator = BigInt(weightTotal);
    const base = Number(numerator / denominator);
    allocations.set(id, base);
    allocated += base;
    return { id, index, remainder: numerator % denominator };
  });
  remainders.sort((a, b) => a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1);
  for (let i = 0; i < amountCents - allocated; i++) {
    const id = remainders[i % remainders.length].id;
    allocations.set(id, (allocations.get(id) ?? 0) + 1);
  }
  return allocations;
}

export function getExpenseSubtotalCents(expense: ExpenseRecord): number {
  return expense.items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPriceCents;
    const next = sum + lineTotal;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(next)) throw new Error("Expense total exceeds the supported range.");
    return next;
  }, 0);
}

/** Returns each member's exact share of items, tax, and tip. */
export function calculateExpenseShares(expense: ExpenseRecord, memberIds: string[]) {
  const orderedIds = [...new Set(memberIds)];
  if (!Number.isSafeInteger(expense.taxCents) || expense.taxCents < 0 || !Number.isSafeInteger(expense.tipCents) || expense.tipCents < 0) {
    throw new Error("Tax and tip must be non-negative integer cents.");
  }
  const itemSubtotals = new Map(orderedIds.map((id) => [id, 0]));
  for (const item of expense.items) {
    const itemShares = calculateItemSharesCents(item, orderedIds);
    for (const [id, cents] of itemShares) {
      const next = (itemSubtotals.get(id) ?? 0) + cents;
      if (!Number.isSafeInteger(next)) throw new Error("Expense subtotal exceeds the supported range.");
      itemSubtotals.set(id, next);
    }
  }

  const tax = allocateProportionally(expense.taxCents, itemSubtotals, orderedIds);
  const tip = allocateProportionally(expense.tipCents, itemSubtotals, orderedIds);
  const shares = new Map(orderedIds.map((id) => [id, (itemSubtotals.get(id) ?? 0) + (tax.get(id) ?? 0) + (tip.get(id) ?? 0)]));
  return shares;
}

export function calculateSettlement(expenses: ExpenseRecord[], members: SettlementMember[]) {
  if (members.length === 0) throw new Error("A settlement needs at least one group member.");
  const memberIds = members.map((member) => member.id);
  const balances = new Map(memberIds.map((id) => [id, 0]));
  for (const expense of expenses) {
    const shares = calculateExpenseShares(expense, memberIds);
    const totalCents = getExpenseSubtotalCents(expense) + expense.taxCents + expense.tipCents;
    if (!Number.isSafeInteger(totalCents)) throw new Error("Expense total exceeds the supported range.");
    if (!balances.has(expense.paidByMemberId)) throw new Error("Expense payer is not in this group.");
    balances.set(expense.paidByMemberId, (balances.get(expense.paidByMemberId) ?? 0) + totalCents);
    for (const [id, share] of shares) balances.set(id, (balances.get(id) ?? 0) - share);
  }

  const creditors = members.map((member, index) => ({ id: member.id, amount: balances.get(member.id) ?? 0, index })).filter((entry) => entry.amount > 0);
  const debtors = members.map((member, index) => ({ id: member.id, amount: -(balances.get(member.id) ?? 0), index })).filter((entry) => entry.amount > 0);
  const transfers: Transfer[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountCents = Math.min(debtor.amount, creditor.amount);
    transfers.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amountCents });
    debtor.amount -= amountCents;
    creditor.amount -= amountCents;
    if (debtor.amount === 0) debtorIndex++;
    if (creditor.amount === 0) creditorIndex++;
  }
  return { balances, transfers };
}
