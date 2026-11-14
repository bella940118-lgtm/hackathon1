import test from "node:test";
import assert from "node:assert/strict";
import { getUnassignedItems } from "./assignments.ts";

test("finds items with no valid current group member assignment", () => {
  const items = [
    { id: "assigned", assignedMemberIds: ["member-1"] },
    { id: "empty", assignedMemberIds: [] },
    { id: "stale", assignedMemberIds: ["removed-member"] },
  ];

  assert.deepEqual(getUnassignedItems(items, ["member-1", "member-2"]).map(({ id }) => id), ["empty", "stale"]);
});

test("does not assign members or mutate the item list", () => {
  const items = [{ id: "unassigned", assignedMemberIds: [] }];
  const before = structuredClone(items);

  getUnassignedItems(items, ["member-1"]);

  assert.deepEqual(items, before);
});
