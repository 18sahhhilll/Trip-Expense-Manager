import * as XLSX from 'xlsx';
import type { Trip, PersonBalance, SettlementPayment } from '../types';
import { formatPaise, paiseToRupees } from '../utils/currency';

export function exportTripToExcel(
  trip: Trip,
  balances: PersonBalance[],
  settlements: SettlementPayment[]
) {
  const wb = XLSX.utils.book_new();

  // Helper map for person names
  const personMap = new Map<string, string>();
  trip.participants.forEach(p => personMap.set(p.id, p.name));

  // --- Sheet 1: Expenses ---
  const expenseData: (string | number)[][] = [
    ['#', 'Expense', 'Amount (₹)', 'Paid By', 'Category', 'Date']
  ];

  let totalExpensePaise = 0;
  trip.expenses.forEach((e, idx) => {
    totalExpensePaise += e.amountPaise;
    const paidByName = personMap.get(e.paidBy) || 'Unknown';
    const dateStr = new Date(e.date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    expenseData.push([
      idx + 1,
      e.description,
      paiseToRupees(e.amountPaise),
      paidByName,
      e.category,
      dateStr
    ]);
  });

  // Total row
  expenseData.push([
    'Total',
    '',
    paiseToRupees(totalExpensePaise),
    '',
    '',
    ''
  ]);

  const wsExpenses = XLSX.utils.aoa_to_sheet(expenseData);
  wsExpenses['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');

  // --- Sheet 2: Balances ---
  const balanceData: (string | number)[][] = [
    ['Person', 'Paid (₹)', 'Share (₹)', 'More / Less']
  ];

  let totalPaidPaise = 0;
  let totalSharePaise = 0;

  balances.forEach(b => {
    totalPaidPaise += b.paidPaise;
    totalSharePaise += b.sharePaise;

    let moreLessStr = 'Settled';
    if (b.netPaise > 0) {
      moreLessStr = `${formatPaise(b.netPaise, trip.currency)} more`;
    } else if (b.netPaise < 0) {
      moreLessStr = `${formatPaise(Math.abs(b.netPaise), trip.currency)} less`;
    }

    balanceData.push([
      b.personName,
      paiseToRupees(b.paidPaise),
      paiseToRupees(b.sharePaise),
      moreLessStr
    ]);
  });

  // Total row
  balanceData.push([
    'Total',
    paiseToRupees(totalPaidPaise),
    paiseToRupees(totalSharePaise),
    ''
  ]);

  const wsBalances = XLSX.utils.aoa_to_sheet(balanceData);
  wsBalances['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsBalances, 'Balances');

  // --- Sheet 3: Settlement ---
  const settlementData: (string | number)[][] = [
    ['From', 'To', 'Amount (₹)', 'Status']
  ];

  settlements.forEach(s => {
    const fromName = personMap.get(s.fromPersonId) || 'Unknown';
    const toName = personMap.get(s.toPersonId) || 'Unknown';
    settlementData.push([
      fromName,
      toName,
      paiseToRupees(s.amountPaise),
      s.settled ? 'Settled' : 'Pending'
    ]);
  });

  const wsSettlement = XLSX.utils.aoa_to_sheet(settlementData);
  wsSettlement['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSettlement, 'Settlement');

  // Generate filename: e.g. Goa-Trip-Expenses.xlsx
  const safeName = trip.name.replace(/[^a-zA-Z0-9_-]/g, '-');
  const dateSuffix = new Date().toISOString().split('T')[0];
  const fileName = `${safeName}-Expenses-${dateSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
