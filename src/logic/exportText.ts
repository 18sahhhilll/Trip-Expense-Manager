import type { Trip, PersonBalance, SettlementPayment } from '../types';
import { formatPaise } from '../utils/currency';

export function formatSettlementText(
  trip: Trip,
  settlements: SettlementPayment[]
): string {
  const personMap = new Map<string, string>();
  trip.participants.forEach(p => personMap.set(p.id, p.name));

  const lines: string[] = [];
  lines.push(`💰 *${trip.name} - Settlement Plan* 💰\n`);

  if (settlements.length === 0) {
    lines.push('All expenses are even! No settlements needed. 🎉');
  } else {
    settlements.forEach((s, idx) => {
      const fromName = personMap.get(s.fromPersonId) || 'Unknown';
      const toName = personMap.get(s.toPersonId) || 'Unknown';
      const statusIcon = s.settled ? '✅' : '👉';
      lines.push(`${idx + 1}. ${fromName} ${statusIcon} ${toName}: ${formatPaise(s.amountPaise, trip.currency)}${s.settled ? ' (Settled)' : ''}`);
    });
  }

  return lines.join('\n');
}

export function formatFullSummaryText(
  trip: Trip,
  balances: PersonBalance[],
  settlements: SettlementPayment[]
): string {
  const personMap = new Map<string, string>();
  trip.participants.forEach(p => personMap.set(p.id, p.name));

  const totalPaise = trip.expenses.reduce((acc, e) => acc + e.amountPaise, 0);

  const lines: string[] = [];
  lines.push(`📊 *${trip.name} - Expense Summary*`);
  lines.push(`Total Expenses: *${formatPaise(totalPaise, trip.currency)}* (${trip.expenses.length} expenses)\n`);

  lines.push(`👥 *Balances:*`);
  balances.forEach(b => {
    let status = '';
    if (b.netPaise > 0) {
      status = `(receives ${formatPaise(b.netPaise, trip.currency)})`;
    } else if (b.netPaise < 0) {
      status = `(owes ${formatPaise(Math.abs(b.netPaise), trip.currency)})`;
    } else {
      status = `(settled)`;
    }
    lines.push(`• ${b.personName}: Paid ${formatPaise(b.paidPaise, trip.currency)}, Share ${formatPaise(b.sharePaise, trip.currency)} ${status}`);
  });

  lines.push(`\n🤝 *Settlement Plan:*`);
  if (settlements.length === 0) {
    lines.push('Everyone is even! 🎉');
  } else {
    settlements.forEach(s => {
      const fromName = personMap.get(s.fromPersonId) || 'Unknown';
      const toName = personMap.get(s.toPersonId) || 'Unknown';
      lines.push(`• ${fromName} ➔ ${toName}: ${formatPaise(s.amountPaise, trip.currency)}${s.settled ? ' (Settled)' : ''}`);
    });
  }

  return lines.join('\n');
}
