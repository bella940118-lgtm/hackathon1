import type { ExpenseRecord } from "@/lib/expenses/types";

export const EXPENSES_STORAGE_KEY = "splitzy.expenses.v1";
export const EXPENSES_UPDATED_EVENT = "splitzy:expenses-updated";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExpense(value: unknown): value is ExpenseRecord {
  if (!isRecord(value) || !Array.isArray(value.items)) return false;
  return typeof value.id === "string" && typeof value.groupId === "string" &&
    typeof value.description === "string" && typeof value.paidByMemberId === "string" &&
    Number.isSafeInteger(value.taxCents) && Number(value.taxCents) >= 0 && Number.isSafeInteger(value.tipCents) && Number(value.tipCents) >= 0 &&
    typeof value.createdAt === "string" && value.items.every((item) => isRecord(item) &&
      typeof item.id === "string" && typeof item.name === "string" && Number.isInteger(item.quantity) && Number(item.quantity) > 0 &&
      Number.isSafeInteger(item.unitPriceCents) && Number(item.unitPriceCents) >= 0 && Array.isArray(item.assignedMemberIds) &&
      item.assignedMemberIds.every((id) => typeof id === "string") &&
      (item.memberSharesCents === undefined || (isRecord(item.memberSharesCents) && Object.values(item.memberSharesCents).every((cents) => Number.isSafeInteger(cents) && Number(cents) >= 0))));
}

export function parseExpenses(serialized: string | null): ExpenseRecord[] {
  if (!serialized) return [];
  try {
    const value: unknown = JSON.parse(serialized);
    return Array.isArray(value) ? value.filter(isExpense) : [];
  } catch { return []; }
}

export function getSavedExpenses(groupId: string): ExpenseRecord[] {
  return parseExpenses(window.localStorage.getItem(EXPENSES_STORAGE_KEY)).filter((expense) => expense.groupId === groupId);
}

export function saveExpense(expense: ExpenseRecord): void {
  const existing = parseExpenses(window.localStorage.getItem(EXPENSES_STORAGE_KEY));
  window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify([expense, ...existing.filter((entry) => entry.id !== expense.id)]));
  window.dispatchEvent(new Event(EXPENSES_UPDATED_EVENT));
}

export function deleteLocalExpense(expenseId: string): void {
  const existing = parseExpenses(window.localStorage.getItem(EXPENSES_STORAGE_KEY));
  window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(existing.filter((entry) => entry.id !== expenseId)));
  window.dispatchEvent(new Event(EXPENSES_UPDATED_EVENT));
}
