export type Category = 'Fuel' | 'Food' | 'Toll' | 'Parking' | 'Stay' | 'Other';

export interface Person {
  id: string;
  name: string;
}

export type SplitMode = 
  | 'equal_everyone'
  | 'equal_selected'
  | 'group_split'
  | 'exact'
  | 'percentage'
  | 'shares';

export interface GroupSplitItem {
  id: string;
  name?: string;
  participantIds: string[];
  amountPaise?: number; // Optional if remainder group
  isRemainder?: boolean; // If true, this group takes whatever is remaining
}

export interface SplitConfig {
  mode: SplitMode;
  selectedParticipantIds?: string[]; // for equal_selected
  groups?: GroupSplitItem[]; // for group_split
  exactAmountsPaise?: Record<string, number>; // personId -> amount in paise
  percentages?: Record<string, number>; // personId -> percentage (0-100)
  shares?: Record<string, number>; // personId -> ratio value e.g. 2, 1, 1
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amountPaise: number; // Integer, in paise
  paidBy: string; // personId
  date: string; // ISO string
  category: Category;
  splitConfig: SplitConfig;
  computedAllocations: Record<string, number>; // personId -> amountPaise
}

export interface SettlementPayment {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  amountPaise: number;
  settled: boolean;
}

export interface PersonBalance {
  personId: string;
  personName: string;
  paidPaise: number;
  sharePaise: number;
  netPaise: number; // positive = receives (more), negative = owes (less)
}

export interface Trip {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  currency: string;
  participants: Person[];
  expenses: Expense[];
  settledPayments?: Record<string, boolean>; // key: `${fromId}->${toId}`, value: true
  createdAt: string;
  updatedAt: string;
}
