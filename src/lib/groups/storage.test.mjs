import assert from "node:assert/strict";
import test from "node:test";
import { parseSavedGroups, serializeSavedGroups } from "./storage.ts";

const sampleGroup = {
  group: {
    id: "group-1",
    name: "Dinner crew",
    memberIds: ["member-1", "member-2"],
    createdAt: "2026-11-14T12:00:00.000Z",
  },
  members: [
    { id: "member-1", name: "Maya" },
    { id: "member-2", name: "Jules" },
  ],
};

test("saved groups round-trip through JSON", () => {
  assert.deepEqual(parseSavedGroups(serializeSavedGroups([sampleGroup])), [sampleGroup]);
});

test("empty or malformed storage returns an empty list", () => {
  assert.deepEqual(parseSavedGroups(null), []);
  assert.deepEqual(parseSavedGroups("not json"), []);
  assert.deepEqual(parseSavedGroups(JSON.stringify({ groups: [] })), []);
});

test("invalid entries are ignored while valid groups are kept", () => {
  const serialized = JSON.stringify([sampleGroup, { group: { id: 1 }, members: [] }]);
  assert.deepEqual(parseSavedGroups(serialized), [sampleGroup]);
});
