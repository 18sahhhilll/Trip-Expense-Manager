import type { Expense, Person, PersonBalance } from '../types';

export function calculateBalances(
  participants: Person[],
  expenses: Expense[]
): PersonBalance[] {
  const paidMap: Record<string, number> = {};
  const shareMap: Record<string, number> = {};

  participants.forEach(p => {
    paidMap[p.id] = 0;
    shareMap[p.id] = 0;
  });

  expenses.forEach(expense => {
    // Add to paid map
    if (paidMap[expense.paidBy] !== undefined) {
      paidMap[expense.paidBy] += expense.amountPaise;
    }

    // Add to share map using computedAllocations
    if (expense.computedAllocations) {
      Object.entries(expense.computedAllocations).forEach(([personId, paise]) => {
        if (shareMap[personId] !== undefined) {
          shareMap[personId] += paise;
        }
      });
    }
  });

  return participants.map(p => {
    const paidPaise = paidMap[p.id] || 0;
    const sharePaise = shareMap[p.id] || 0;
    const netPaise = paidPaise - sharePaise;

    return {
      personId: p.id,
      personName: p.name,
      paidPaise,
      sharePaise,
      netPaise,
    };
  });
}
