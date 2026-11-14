/** A shared contract for the group splitting and receipt scanning features. */
export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
}

export interface Receipt {
  id: string;
  groupId: string;
  merchant: string;
  date: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  assignedMemberIds: string[];
}

/** A recorded share or payment obligation within a group. */
export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidByMemberId: string;
  participantMemberIds: string[];
  receiptId?: string;
  createdAt: string;
}
