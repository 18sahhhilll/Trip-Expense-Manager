import type { PersonBalance, SettlementPayment } from '../types';

export function calculateSettlementPlan(
  balances: PersonBalance[],
  settledPaymentsState: Record<string, boolean> = {}
): SettlementPayment[] {
  const debtors: { personId: string; debtPaise: number }[] = [];
  const creditors: { personId: string; creditPaise: number }[] = [];

  balances.forEach(b => {
    if (b.netPaise < 0) {
      debtors.push({ personId: b.personId, debtPaise: Math.abs(b.netPaise) });
    } else if (b.netPaise > 0) {
      creditors.push({ personId: b.personId, creditPaise: b.netPaise });
    }
  });

  // Sort creditors descending by credit amount so largest creditors get settled first
  creditors.sort((a, b) => b.creditPaise - a.creditPaise);

  const payments: SettlementPayment[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amountPaise = Math.min(debtor.debtPaise, creditor.creditPaise);

    if (amountPaise > 0) {
      const paymentId = `${debtor.personId}->${creditor.personId}`;
      payments.push({
        id: paymentId,
        fromPersonId: debtor.personId,
        toPersonId: creditor.personId,
        amountPaise,
        settled: !!settledPaymentsState[paymentId],
      });

      debtor.debtPaise -= amountPaise;
      creditor.creditPaise -= amountPaise;
    }

    if (debtor.debtPaise === 0) dIdx++;
    if (creditor.creditPaise === 0) cIdx++;
  }

  return payments;
}
