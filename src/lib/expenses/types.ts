/** Browser-only expense record. Amounts are always integer cents. */
export interface ExpenseItemRecord {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  assignedMemberIds: string[];
  /** Persisted item-level cents shares; absent for legacy/local drafts. */
  memberSharesCents?: Record<string, number>;
}

export interface ExpenseRecord {
  id: string;
  groupId: string;
  description: string;
  paidByMemberId: string;
  items: ExpenseItemRecord[];
  taxCents: number;
  tipCents: number;
  createdAt: string;
}
