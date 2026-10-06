import type { Trip, Person, Expense } from '../types';
import { calculateSplitAllocations } from '../logic/splitEngine';

export const SAMPLE_PARTICIPANTS: Person[] = [
  { id: 'p_jay', name: 'Jay' },
  { id: 'p_ved_ruparel', name: 'Ved Ruparel' },
  { id: 'p_niraj', name: 'Niraj' },
  { id: 'p_sahil', name: 'Sahil' },
  { id: 'p_ved_ramjiyani', name: 'Ved Ramjiyani' },
];

const participantIds = SAMPLE_PARTICIPANTS.map(p => p.id);

const rawSampleExpenses: {
  description: string;
  amountPaise: number;
  paidBy: string;
  category: 'Toll' | 'Fuel' | 'Food' | 'Parking' | 'Other';
  date: string;
}[] = [
  { description: 'Toll Tax', amountPaise: 45000, paidBy: 'p_jay', category: 'Toll', date: '2026-10-01T09:30:00.000Z' },
  { description: 'Petrol – Going', amountPaise: 232000, paidBy: 'p_ved_ruparel', category: 'Fuel', date: '2026-10-01T10:15:00.000Z' },
  { description: 'Lunch', amountPaise: 59000, paidBy: 'p_niraj', category: 'Food', date: '2026-10-01T13:00:00.000Z' },
  { description: 'Juice', amountPaise: 17000, paidBy: 'p_sahil', category: 'Food', date: '2026-10-01T16:00:00.000Z' },
  { description: 'Parking Charges', amountPaise: 20000, paidBy: 'p_jay', category: 'Parking', date: '2026-10-01T17:30:00.000Z' },
  { description: 'Fruits', amountPaise: 10000, paidBy: 'p_ved_ramjiyani', category: 'Food', date: '2026-10-01T18:45:00.000Z' },
  { description: 'Chips', amountPaise: 17000, paidBy: 'p_ved_ruparel', category: 'Food', date: '2026-10-01T19:30:00.000Z' },
  { description: 'Tea & Biscuits', amountPaise: 23500, paidBy: 'p_ved_ramjiyani', category: 'Food', date: '2026-10-02T08:00:00.000Z' },
  { description: 'Petrol – Returning', amountPaise: 134000, paidBy: 'p_jay', category: 'Fuel', date: '2026-10-02T11:00:00.000Z' },
  { description: 'Dinner', amountPaise: 162000, paidBy: 'p_sahil', category: 'Food', date: '2026-10-02T20:00:00.000Z' },
];

export function getSampleTrip(): Trip {
  const expenses: Expense[] = rawSampleExpenses.map((e, idx) => {
    const splitConfig = { mode: 'equal_everyone' as const };
    const { allocations } = calculateSplitAllocations(e.amountPaise, splitConfig, participantIds);

    return {
      id: `exp_sample_${idx + 1}`,
      tripId: 'trip_sample_goa',
      description: e.description,
      amountPaise: e.amountPaise,
      paidBy: e.paidBy,
      date: e.date,
      category: e.category,
      splitConfig,
      computedAllocations: allocations,
    };
  });

  return {
    id: 'trip_sample_goa',
    name: 'Goa Road Trip',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    currency: '₹',
    participants: [...SAMPLE_PARTICIPANTS],
    expenses,
    settledPayments: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
