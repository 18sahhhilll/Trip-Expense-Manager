import React from 'react';
import type { SettlementPayment, Person } from '../types';
import { formatPaise } from '../utils/currency';
import { Check, Copy, ArrowRight, PartyPopper } from 'lucide-react';

interface TableSettlementPlanProps {
  settlements: SettlementPayment[];
  participants: Person[];
  currency: string;
  onToggleSettled: (paymentId: string) => void;
  onCopySettlementText: () => void;
}

export const TableSettlementPlan: React.FC<TableSettlementPlanProps> = ({
  settlements,
  participants,
  currency,
  onToggleSettled,
  onCopySettlementText,
}) => {
  const personMap = new Map<string, string>();
  participants.forEach(p => personMap.set(p.id, p.name));

  const allSettled = settlements.length > 0 && settlements.every(s => s.settled);

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="app-card p-3 sm:p-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-ink)]">
            Optimal Settlement Plan
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Greedy algorithm minimizes transactions ({settlements.length} transfer{settlements.length === 1 ? '' : 's'} needed)
          </p>
        </div>

        <button
          onClick={onCopySettlementText}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary-main)] text-white hover:bg-[var(--primary-hover)] transition-colors min-h-[44px] sm:min-h-[36px] whitespace-nowrap shadow-xs"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copy for WhatsApp</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Status</th>
                <th className="py-3 px-4">From (Payer)</th>
                <th className="py-3 px-4 text-center w-12"></th>
                <th className="py-3 px-4">To (Receiver)</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)]">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PartyPopper className="w-8 h-8 text-[var(--positive-main)]" />
                      <p className="text-base font-semibold text-[var(--text-ink)]">
                        All settled up!
                      </p>
                      <p className="text-xs">
                        Everyone has paid their exact share. No transfers required.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                settlements.map(s => {
                  const fromName = personMap.get(s.fromPersonId) || 'Unknown';
                  const toName = personMap.get(s.toPersonId) || 'Unknown';

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-[var(--bg-surface-hover)] transition-colors ${
                        s.settled ? 'opacity-60 bg-[var(--bg-main)]/50' : ''
                      }`}
                    >
                      {/* Checkbox toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <label className="inline-flex items-center cursor-pointer min-w-[24px] min-h-[24px] justify-center">
                          <input
                            type="checkbox"
                            checked={s.settled}
                            onChange={() => onToggleSettled(s.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            s.settled 
                              ? 'bg-[var(--positive-main)] border-[var(--positive-main)] text-white' 
                              : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--primary-main)]'
                          }`}>
                            {s.settled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </label>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[var(--text-ink)]">
                        <span className={s.settled ? 'line-through text-[var(--text-muted)]' : ''}>
                          {fromName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-[var(--text-muted)]">
                        <ArrowRight className="w-4 h-4 inline" />
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[var(--text-ink)]">
                        <span className={s.settled ? 'line-through text-[var(--text-muted)]' : ''}>
                          {toName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-base text-[var(--text-ink)]">
                        <span className={s.settled ? 'line-through text-[var(--text-muted)]' : 'text-[var(--accent-main)]'}>
                          {formatPaise(s.amountPaise, currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {allSettled && (
          <div className="bg-[var(--positive-bg)] p-3 text-center text-xs font-semibold text-[var(--positive-main)] border-t border-[var(--border-color)]">
            🎉 All pending payments in this plan have been marked as settled!
          </div>
        )}
      </div>
    </div>
  );
};
