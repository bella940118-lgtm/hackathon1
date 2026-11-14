import type { Receipt } from "@/types";

/** Sample receipt used by the UI and API route without API credentials. */
export const mockReceipt: Receipt = {
  id: "receipt-demo-001",
  groupId: "group-demo",
  merchant: "Sunday Table Cafe",
  date: "2026-11-14",
  subtotal: 42,
  tax: 3.36,
  tip: 5.04,
  total: 50.4,
  items: [
    { id: "item-1", name: "Avocado toast", quantity: 1, unitPrice: 14, total: 14, assignedMemberIds: ["member-maya"] },
    { id: "item-2", name: "Sunday pasta", quantity: 1, unitPrice: 22, total: 22, assignedMemberIds: ["member-jules"] },
    { id: "item-3", name: "House lemonade", quantity: 1, unitPrice: 6, total: 6, assignedMemberIds: ["member-alex"] },
  ],
};
