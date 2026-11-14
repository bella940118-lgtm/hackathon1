import { calculateItemSharesCents } from "./calculations.ts";
import type { ExpenseRecord } from "./types.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

type CloudRow = Record<string, unknown>;

function cents(value: unknown): number {
  const amount = typeof value === "string" ? Number(value) : value;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0) throw new Error("Supabase returned an invalid cents value.");
  return amount;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Supabase returned an invalid ${field}.`);
  return value;
}

export function toCloudExpensePayload(expense: ExpenseRecord, groupMemberIds: string[]) {
  return {
    id: expense.id,
    group_id: expense.groupId,
    paid_by_member_id: expense.paidByMemberId,
    description: expense.description,
    tax_cents: expense.taxCents,
    tip_cents: expense.tipCents,
    created_at: expense.createdAt,
    items: expense.items.map((item, sortOrder) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents,
      sort_order: sortOrder,
      splits: [...calculateItemSharesCents(item, groupMemberIds)].map(([member_id, amount_cents]) => ({ member_id, amount_cents })),
    })),
  };
}

export function mapCloudExpenseRows(
  expenseRows: CloudRow[],
  itemRows: CloudRow[],
  splitRows: CloudRow[],
  orderedMemberIds: string[],
): ExpenseRecord[] {
  const splitsByItem = new Map<string, Map<string, number>>();
  for (const row of splitRows) {
    const itemId = text(row.expense_item_id, "item split expense_item_id");
    const memberId = text(row.member_id, "item split member_id");
    const shares = splitsByItem.get(itemId) ?? new Map<string, number>();
    shares.set(memberId, cents(row.amount_cents));
    splitsByItem.set(itemId, shares);
  }

  const itemsByExpense = new Map<string, ExpenseRecord["items"]>();
  for (const row of itemRows) {
    const expenseId = text(row.expense_id, "expense item expense_id");
    const id = text(row.id, "expense item id");
    const savedShares = splitsByItem.get(id) ?? new Map<string, number>();
    const assignedMemberIds = orderedMemberIds.filter((memberId) => savedShares.has(memberId));
    const memberSharesCents = Object.fromEntries(assignedMemberIds.map((memberId) => [memberId, savedShares.get(memberId)!]));
    const items = itemsByExpense.get(expenseId) ?? [];
    items.push({
      id,
      name: text(row.name, "expense item name"),
      quantity: Number(row.quantity),
      unitPriceCents: cents(row.unit_price_cents),
      assignedMemberIds,
      memberSharesCents,
    });
    itemsByExpense.set(expenseId, items);
  }

  return expenseRows.map((row) => {
    const id = text(row.id, "expense id");
    return {
      id,
      groupId: text(row.group_id, "expense group_id"),
      description: text(row.description, "expense description"),
      paidByMemberId: text(row.paid_by_member_id, "expense paid_by_member_id"),
      taxCents: cents(row.tax_cents),
      tipCents: cents(row.tip_cents),
      createdAt: text(row.created_at, "expense created_at"),
      items: itemsByExpense.get(id) ?? [],
    };
  });
}

export async function loadCloudExpenses(client: SupabaseClient, groupId: string, memberIds: string[]) {
  const { data: expenseRows, error: expenseError } = await client
    .from("expenses")
    .select("id,group_id,description,paid_by_member_id,tax_cents,tip_cents,created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (expenseError) throw expenseError;
  if (!expenseRows?.length) return [];

  const expenseIds = expenseRows.map((row) => row.id);
  const { data: itemRows, error: itemError } = await client
    .from("expense_items")
    .select("id,expense_id,group_id,name,quantity,unit_price_cents,sort_order")
    .eq("group_id", groupId)
    .in("expense_id", expenseIds)
    .order("sort_order", { ascending: true });
  if (itemError) throw itemError;
  const itemIds = (itemRows ?? []).map((row) => row.id);
  let splitRows: CloudRow[] = [];
  if (itemIds.length) {
    const { data, error } = await client
      .from("item_splits")
      .select("expense_item_id,group_id,member_id,amount_cents")
      .eq("group_id", groupId)
      .in("expense_item_id", itemIds);
    if (error) throw error;
    splitRows = data ?? [];
  }
  return mapCloudExpenseRows(expenseRows, itemRows ?? [], splitRows, memberIds);
}

export async function saveCloudExpense(client: SupabaseClient, expense: ExpenseRecord, memberIds: string[], allowUpdate = true) {
  const { data, error } = await client.rpc("save_expense", {
    p_expense: toCloudExpensePayload(expense, memberIds),
    p_allow_update: allowUpdate,
  });
  if (error) throw error;
  return data;
}

export async function deleteCloudExpense(client: SupabaseClient, expenseId: string, groupId: string) {
  const { data, error } = await client
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("group_id", groupId)
    .select("id");
  if (error) throw error;
  if (!data?.length) throw new Error("Expense was not found or you do not have permission to delete it.");
}
