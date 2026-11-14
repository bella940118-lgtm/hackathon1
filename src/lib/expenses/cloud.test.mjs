import assert from "node:assert/strict";
import test from "node:test";
import { deleteCloudExpense, mapCloudExpenseRows, saveCloudExpense, toCloudExpensePayload } from "./cloud.ts";

const expense = {
  id: "expense-1", groupId: "group-1", description: "Dinner", paidByMemberId: "member-a",
  taxCents: 3, tipCents: 2, createdAt: "2026-11-14T12:00:00.000Z",
  items: [{ id: "item-1", name: "Toast", quantity: 1, unitPriceCents: 101, assignedMemberIds: ["member-a", "member-b"] }],
};

test("cloud payload stores integer cents and deterministic item split rows", () => {
  const payload = toCloudExpensePayload(expense, ["member-a", "member-b"]);
  assert.equal(payload.tax_cents, 3);
  assert.equal(payload.items[0].unit_price_cents, 101);
  assert.deepEqual(payload.items[0].splits, [
    { member_id: "member-a", amount_cents: 51 },
    { member_id: "member-b", amount_cents: 50 },
  ]);
});

test("cloud rows round-trip into settlement-compatible expense records", () => {
  const loaded = mapCloudExpenseRows(
    [{ id: "expense-1", group_id: "group-1", description: "Dinner", paid_by_member_id: "member-a", tax_cents: "3", tip_cents: "2", created_at: expense.createdAt }],
    [{ id: "item-1", expense_id: "expense-1", group_id: "group-1", name: "Toast", quantity: 1, unit_price_cents: "101", sort_order: 0 }],
    [{ expense_item_id: "item-1", group_id: "group-1", member_id: "member-b", amount_cents: "50" }, { expense_item_id: "item-1", group_id: "group-1", member_id: "member-a", amount_cents: "51" }],
    ["member-a", "member-b"],
  );
  assert.equal(loaded[0].taxCents, 3);
  assert.deepEqual(loaded[0].items[0].assignedMemberIds, ["member-a", "member-b"]);
  assert.deepEqual(loaded[0].items[0].memberSharesCents, { "member-a": 51, "member-b": 50 });
});

test("create-only imports use the atomic RPC and cannot opt into updates", async () => {
  let call;
  const client = { rpc: async (...args) => { call = args; return { data: "expense-1", error: null }; } };
  await saveCloudExpense(client, expense, ["member-a", "member-b"], false);
  assert.equal(call[0], "save_expense");
  assert.equal(call[1].p_allow_update, false);
  assert.equal(call[1].p_expense.id, expense.id);
});

test("cloud deletion targets one group-owned expense row", async () => {
  const clauses = [];
  const query = {
    eq: (column, value) => { clauses.push([column, value]); return query; },
    select: async (columns) => ({ data: [{ id: "expense-1" }], error: null, columns }),
  };
  const client = { from: (table) => ({ delete: () => { clauses.push(["table", table]); return query; } }) };
  await deleteCloudExpense(client, "expense-1", "group-1");
  assert.deepEqual(clauses, [["table", "expenses"], ["id", "expense-1"], ["group_id", "group-1"]]);
});
