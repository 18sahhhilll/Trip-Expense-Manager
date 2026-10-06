import React from 'react';
import type { PersonBalance } from '../types';
import { formatPaise } from '../utils/currency';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

interface TableBalanceSummaryProps {
  balances: PersonBalance[];
  currency: string;
}

export const TableBalanceSummary: React.FC<TableBalanceSummaryProps> = ({
  balances,
  currency,
}) => {
  const totalPaidPaise = balances.reduce((acc, b) => acc + b.paidPaise, 0);
  const totalSharePaise = balances.reduce((acc, b) => acc + b.sharePaise, 0);

  return (
    <div className="space-y-4">
      {/* Intro info box */}
      <div className="app-card p-3 sm:p-4 bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-muted)] border-l-4 border-l-[var(--primary-main)]">
        <p>
          <strong className="text-[var(--text-ink)] font-semibold">Share</strong> reflects each person's exact computed share based on chosen split rules. 
          <strong className="text-[var(--text-ink)] font-semibold ml-1">More/Less</strong> indicates whether a person receives money back or needs to pay into the pool.
        </p>
      </div>

      {/* Table Card */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Person</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Share</th>
                <th className="py-3 px-4 text-right">More / Less</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)]">
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">
                    No participants or balances yet.
                  </td>
                </tr>
              ) : (
                balances.map(b => {
                  const isPositive = b.netPaise > 0;
                  const isNegative = b.netPaise < 0;
                  const isZero = b.netPaise === 0;

                  return (
                    <tr key={b.personId} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-ink)]">
                        {b.personName}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--text-ink)]">
                        {formatPaise(b.paidPaise, currency)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--text-ink)]">
                        {formatPaise(b.sharePaise, currency)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        {isPositive && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[var(--positive-main)] bg-[var(--positive-bg)] px-2.5 py-1 rounded-full text-xs">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {formatPaise(b.netPaise, currency)} more
                          </span>
                        )}

                        {isNegative && (
                          <span className="inline-flex items-center gap-1 font-semibold text-[var(--negative-main)] bg-[var(--negative-bg)] px-2.5 py-1 rounded-full text-xs">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            {formatPaise(Math.abs(b.netPaise), currency)} less
                          </span>
                        )}

                        {isZero && (
                          <span className="inline-flex items-center gap-1 text-[var(--text-muted)] bg-[var(--bg-main)] px-2.5 py-1 rounded-full text-xs border border-[var(--border-color)]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Row */}
            {balances.length > 0 && (
              <tfoot>
                <tr className="bg-[var(--bg-main)] font-bold border-t-2 border-[var(--border-color)] text-[var(--text-ink)]">
                  <td className="py-3.5 px-4 text-sm">Total</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sm text-[var(--text-ink)]">
                    {formatPaise(totalPaidPaise, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sm text-[var(--text-ink)]">
                    {formatPaise(totalSharePaise, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-[var(--text-muted)] font-normal">
                    {totalPaidPaise === totalSharePaise ? 'Sum matches (Balanced)' : 'Mismatch alert'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
