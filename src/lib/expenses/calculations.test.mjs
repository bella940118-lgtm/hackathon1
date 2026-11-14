import assert from "node:assert/strict";
import test from "node:test";
import { calculateExpenseShares, calculateSettlement, parseMoneyToCents } from "./calculations.ts";

const splitReceipt = {
  id: "receipt-1", groupId: "group-1", description: "Cafe", paidByMemberId: "a",
  items: [
    { id: "i1", name: "Toast", quantity: 1, unitPriceCents: 101, assignedMemberIds: ["a", "b"] },
    { id: "i2", name: "Coffee", quantity: 1, unitPriceCents: 200, assignedMemberIds: ["b"] },
  ], taxCents: 3, tipCents: 2, createdAt: "2026-11-14T00:00:00.000Z",
};

test("parses currency into integer cents and rejects excess precision", () => {
  assert.equal(parseMoneyToCents("12"), 1200);
  assert.equal(parseMoneyToCents("$12.3"), 1230);
  assert.equal(parseMoneyToCents("0.01"), 1);
  assert.equal(parseMoneyToCents("12.345"), null);
  assert.equal(parseMoneyToCents("-1.00"), null);
});

test("splits assigned items and allocates tax and tip proportionally with exact cents", () => {
  const shares = calculateExpenseShares(splitReceipt, ["a", "b"]);
  assert.deepEqual([...shares], [["a", 52], ["b", 254]]);
  assert.equal([...shares.values()].reduce((sum, cents) => sum + cents, 0), 306);
});

test("distributes odd cents deterministically in group-member order", () => {
  const shares = calculateExpenseShares({ ...splitReceipt, items: [{ id: "i1", name: "Snack", quantity: 1, unitPriceCents: 100, assignedMemberIds: ["a", "b", "c"] }], taxCents: 0, tipCents: 0 }, ["a", "b", "c"]);
  assert.deepEqual([...shares], [["a", 34], ["b", 33], ["c", 33]]);
});

test("settlement nets payments and shares into a minimal transfer", () => {
  const second = { ...splitReceipt, id: "receipt-2", paidByMemberId: "b", items: [{ id: "i2", name: "Coffee", quantity: 1, unitPriceCents: 200, assignedMemberIds: ["b"] }], taxCents: 0, tipCents: 0 };
  const { balances, transfers } = calculateSettlement([splitReceipt, second], [{ id: "a", name: "A" }, { id: "b", name: "B" }]);
  assert.deepEqual([...balances], [["a", 254], ["b", -254]]);
  assert.deepEqual(transfers, [{ fromMemberId: "b", toMemberId: "a", amountCents: 254 }]);
});
