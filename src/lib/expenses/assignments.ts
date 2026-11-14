type AssignableItem = {
  id: string;
  assignedMemberIds: string[];
};

/** Returns items with no assignment to a current group member. */
export function getUnassignedItems<T extends AssignableItem>(items: T[], memberIds: string[]): T[] {
  const validMemberIds = new Set(memberIds);
  return items.filter((item) => !item.assignedMemberIds.some((memberId) => validMemberIds.has(memberId)));
}
