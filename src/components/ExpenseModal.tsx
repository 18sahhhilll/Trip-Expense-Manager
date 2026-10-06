import React, { useState, useEffect, useMemo } from 'react';
import type { Expense, Person, Category, SplitMode, GroupSplitItem } from '../types';
import { rupeesToPaise, formatPaise } from '../utils/currency';
import { calculateSplitAllocations } from '../logic/splitEngine';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'tripId'> & { id?: string }) => void;
  participants: Person[];
  currency: string;
  initialExpense?: Expense | null;
}

const CATEGORIES: Category[] = ['Food', 'Fuel', 'Toll', 'Parking', 'Stay', 'Other'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  participants,
  currency,
  initialExpense,
}) => {
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  // Split state
  const [splitMode, setSplitMode] = useState<SplitMode>('equal_everyone');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [exactAmountsRupees, setExactAmountsRupees] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});
  
  // Group split state
  const [groups, setGroups] = useState<GroupSplitItem[]>([]);

  const [formError, setFormError] = useState('');

  // Initialize form when opening/editing
  useEffect(() => {
    if (initialExpense) {
      setDescription(initialExpense.description);
      setAmountRupees((initialExpense.amountPaise / 100).toString());
      setPaidBy(initialExpense.paidBy);
      setCategory(initialExpense.category);
      setDate(new Date(initialExpense.date).toISOString().slice(0, 16));
      setSplitMode(initialExpense.splitConfig.mode);

      if (initialExpense.splitConfig.selectedParticipantIds) {
        setSelectedParticipantIds(initialExpense.splitConfig.selectedParticipantIds);
      } else {
        setSelectedParticipantIds(participants.map(p => p.id));
      }

      if (initialExpense.splitConfig.exactAmountsPaise) {
        const ex: Record<string, string> = {};
        Object.entries(initialExpense.splitConfig.exactAmountsPaise).forEach(([id, paise]) => {
          ex[id] = (paise / 100).toString();
        });
        setExactAmountsRupees(ex);
      }

      if (initialExpense.splitConfig.percentages) {
        const pcts: Record<string, string> = {};
        Object.entries(initialExpense.splitConfig.percentages).forEach(([id, pct]) => {
          pcts[id] = pct.toString();
        });
        setPercentages(pcts);
      }

      if (initialExpense.splitConfig.shares) {
        const shs: Record<string, string> = {};
        Object.entries(initialExpense.splitConfig.shares).forEach(([id, s]) => {
          shs[id] = s.toString();
        });
        setShares(shs);
      }

      if (initialExpense.splitConfig.groups) {
        setGroups(initialExpense.splitConfig.groups);
      } else {
        initDefaultGroups();
      }
    } else {
      // Default new expense
      setDescription('');
      setAmountRupees('');
      setPaidBy(participants[0]?.id || '');
      setCategory('Food');
      setDate(new Date().toISOString().slice(0, 16));
      setSplitMode('equal_everyone');
      setSelectedParticipantIds(participants.map(p => p.id));
      setExactAmountsRupees({});
      setPercentages({});
      setShares({});
      initDefaultGroups();
    }
    setFormError('');
  }, [initialExpense, isOpen, participants]);

  const initDefaultGroups = () => {
    setGroups([
      {
        id: 'g_1',
        name: 'Group 1',
        participantIds: participants.slice(0, Math.ceil(participants.length / 2)).map(p => p.id),
        amountPaise: 0,
        isRemainder: false,
      },
      {
        id: 'g_2',
        name: 'Group 2 (Remainder)',
        participantIds: participants.slice(Math.ceil(participants.length / 2)).map(p => p.id),
        isRemainder: true,
      },
    ]);
  };

  const amountPaise = useMemo(() => {
    return rupeesToPaise(amountRupees);
  }, [amountRupees]);

  const allParticipantIds = useMemo(() => participants.map(p => p.id), [participants]);

  // Current split config object
  const currentSplitConfig = useMemo(() => {
    const config: any = { mode: splitMode };
    if (splitMode === 'equal_selected') {
      config.selectedParticipantIds = selectedParticipantIds;
    } else if (splitMode === 'group_split') {
      config.groups = groups;
    } else if (splitMode === 'exact') {
      const exacts: Record<string, number> = {};
      allParticipantIds.forEach(id => {
        exacts[id] = rupeesToPaise(exactAmountsRupees[id] || '0');
      });
      config.exactAmountsPaise = exacts;
    } else if (splitMode === 'percentage') {
      const pcts: Record<string, number> = {};
      allParticipantIds.forEach(id => {
        pcts[id] = parseFloat(percentages[id] || '0');
      });
      config.percentages = pcts;
    } else if (splitMode === 'shares') {
      const shs: Record<string, number> = {};
      allParticipantIds.forEach(id => {
        shs[id] = parseFloat(shares[id] || '0');
      });
      config.shares = shs;
    }
    return config;
  }, [splitMode, selectedParticipantIds, groups, exactAmountsRupees, percentages, shares, allParticipantIds]);

  // Live split calculation
  const splitCalculation = useMemo(() => {
    return calculateSplitAllocations(amountPaise, currentSplitConfig, allParticipantIds);
  }, [amountPaise, currentSplitConfig, allParticipantIds]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError('Please enter an expense description.');
      return;
    }
    if (amountPaise <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!paidBy) {
      setFormError('Please select who paid for this expense.');
      return;
    }
    if (!splitCalculation.isValid) {
      setFormError(splitCalculation.errorMessage || 'Invalid split settings.');
      return;
    }

    onSave({
      id: initialExpense?.id,
      description: description.trim(),
      amountPaise,
      paidBy,
      date: new Date(date).toISOString(),
      category,
      splitConfig: currentSplitConfig,
      computedAllocations: splitCalculation.allocations,
    });
    onClose();
  };

  const toggleSelectedParticipant = (id: string) => {
    if (selectedParticipantIds.includes(id)) {
      setSelectedParticipantIds(selectedParticipantIds.filter(pId => pId !== id));
    } else {
      setSelectedParticipantIds([...selectedParticipantIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full sm:max-w-xl bg-[var(--bg-surface)] rounded-t-2xl sm:rounded-xl border border-[var(--border-color)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
          <h2 className="text-base font-semibold text-[var(--text-ink)]">
            {initialExpense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded-md min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {formError && (
            <div className="p-3 bg-[var(--negative-bg)] text-[var(--negative-main)] rounded-md text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Fuel, Lunch, Toll"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="app-input text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountRupees}
                onChange={e => setAmountRupees(e.target.value)}
                className="app-input text-sm font-mono font-semibold"
                required
              />
            </div>
          </div>

          {/* Paid By & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={e => setPaidBy(e.target.value)}
                className="app-input text-sm font-medium"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="app-input text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="app-input text-sm font-mono"
            />
          </div>

          <hr className="border-[var(--border-color)] my-2" />

          {/* Split Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">
              Split Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[var(--bg-main)] p-1.5 rounded-lg border border-[var(--border-color)]">
              {[
                { id: 'equal_everyone', label: 'Equal (Everyone)' },
                { id: 'equal_selected', label: 'Equal (Selected)' },
                { id: 'group_split', label: 'Group Split' },
                { id: 'exact', label: 'Exact Amounts' },
                { id: 'percentage', label: 'Percentage (%)' },
                { id: 'shares', label: 'Ratio / Shares' },
              ].map(mode => (
                <button
                  type="button"
                  key={mode.id}
                  onClick={() => setSplitMode(mode.id as SplitMode)}
                  className={`px-2.5 py-2 text-xs font-medium rounded-md transition-colors text-center min-h-[44px] sm:min-h-[36px] flex items-center justify-center ${
                    splitMode === mode.id
                      ? 'bg-[var(--primary-main)] text-white shadow-xs font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-ink)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Bar */}
          <div className="p-3 rounded-lg bg-[var(--primary-light)] text-[var(--primary-main)] border border-[var(--primary-main)]/20 text-xs font-medium flex items-center justify-between">
            <span>Live Split Preview:</span>
            <span className="font-semibold font-mono">
              {splitCalculation.isValid
                ? `${Object.values(splitCalculation.allocations).filter(v => v > 0).length} sharing`
                : 'Invalid split settings'}
            </span>
          </div>

          {/* Split Mode Details */}
          {/* a) Equal Everyone */}
          {splitMode === 'equal_everyone' && (
            <div className="p-3 bg-[var(--bg-main)] rounded-lg text-xs text-[var(--text-muted)] space-y-1 border border-[var(--border-color)]">
              <p>Split equally among all {participants.length} participants.</p>
              {amountPaise > 0 && (
                <p className="font-semibold text-[var(--text-ink)] font-mono text-sm">
                  Each person pays ~{formatPaise(Math.round(amountPaise / participants.length), currency)}
                </p>
              )}
            </div>
          )}

          {/* b) Equal Selected */}
          {splitMode === 'equal_selected' && (
            <div className="space-y-2">
              <span className="text-xs text-[var(--text-muted)]">Select participants to share:</span>
              <div className="grid grid-cols-2 gap-2">
                {participants.map(p => {
                  const isChecked = selectedParticipantIds.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleSelectedParticipant(p.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-md border flex items-center justify-between min-h-[44px] ${
                        isChecked
                          ? 'border-[var(--primary-main)] bg-[var(--primary-light)] text-[var(--primary-main)]'
                          : 'border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      <span>{p.name}</span>
                      {isChecked && <Check className="w-4 h-4 text-[var(--primary-main)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* c) Group Split */}
          {splitMode === 'group_split' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Sub-Groups</span>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `g_${Date.now()}`;
                    setGroups([...groups, { id: newId, name: `Group ${groups.length + 1}`, participantIds: [], amountPaise: 0, isRemainder: false }]);
                  }}
                  className="text-xs font-medium text-[var(--primary-main)] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Group
                </button>
              </div>

              {groups.map((g, gIdx) => (
                <div key={g.id} className="p-3 border border-[var(--border-color)] bg-[var(--bg-main)] rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={g.name || ''}
                      onChange={e => {
                        const updated = [...groups];
                        updated[gIdx].name = e.target.value;
                        setGroups(updated);
                      }}
                      className="app-input text-xs py-1 h-8 flex-1"
                      placeholder="Group name (e.g. Veg group)"
                    />

                    {!g.isRemainder && (
                      <input
                        type="number"
                        placeholder="Amount (₹)"
                        value={g.amountPaise ? (g.amountPaise / 100).toString() : ''}
                        onChange={e => {
                          const updated = [...groups];
                          updated[gIdx].amountPaise = rupeesToPaise(e.target.value);
                          setGroups(updated);
                        }}
                        className="app-input text-xs py-1 h-8 w-28 font-mono"
                      />
                    )}

                    <label className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!g.isRemainder}
                        onChange={e => {
                          const updated = groups.map((item, idx) => ({
                            ...item,
                            isRemainder: idx === gIdx ? e.target.checked : false,
                          }));
                          setGroups(updated);
                        }}
                      />
                      Remainder
                    </label>

                    {groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGroups(groups.filter((_, idx) => idx !== gIdx))}
                        className="p-1 text-[var(--negative-main)] hover:bg-[var(--negative-bg)] rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {participants.map(p => {
                      const inGroup = g.participantIds.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => {
                            const updated = [...groups];
                            if (inGroup) {
                              updated[gIdx].participantIds = g.participantIds.filter(id => id !== p.id);
                            } else {
                              updated[gIdx].participantIds = [...g.participantIds, p.id];
                            }
                            setGroups(updated);
                          }}
                          className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                            inGroup
                              ? 'bg-[var(--primary-main)] text-white border-[var(--primary-main)]'
                              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-color)]'
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* d) Exact Amounts */}
          {splitMode === 'exact' && (
            <div className="space-y-2">
              <span className="text-xs text-[var(--text-muted)]">Enter exact amount per person:</span>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--text-ink)] w-32 truncate">{p.name}</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={exactAmountsRupees[p.id] || ''}
                      onChange={e => setExactAmountsRupees({ ...exactAmountsRupees, [p.id]: e.target.value })}
                      className="app-input text-xs py-1 h-9 font-mono text-right w-36"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* e) Percentage */}
          {splitMode === 'percentage' && (
            <div className="space-y-2">
              <span className="text-xs text-[var(--text-muted)]">Enter percentage (%) per person:</span>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--text-ink)] w-32 truncate">{p.name}</span>
                    <div className="relative w-36">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={percentages[p.id] || ''}
                        onChange={e => setPercentages({ ...percentages, [p.id]: e.target.value })}
                        className="app-input text-xs py-1 h-9 font-mono text-right pr-6"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* f) Shares / Ratio */}
          {splitMode === 'shares' && (
            <div className="space-y-2">
              <span className="text-xs text-[var(--text-muted)]">Enter share ratio per person (e.g. 2, 1, 1):</span>
              <div className="space-y-2">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--text-ink)] w-32 truncate">{p.name}</span>
                    <input
                      type="number"
                      step="1"
                      placeholder="1"
                      value={shares[p.id] || ''}
                      onChange={e => setShares({ ...shares, [p.id]: e.target.value })}
                      className="app-input text-xs py-1 h-9 font-mono text-right w-36"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual computed allocations preview list */}
          {splitCalculation.isValid && (
            <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)]">
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-2">Calculated Person Shares:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {participants.map(p => (
                  <div key={p.id} className="text-xs flex items-center justify-between bg-[var(--bg-surface)] p-2 rounded border border-[var(--border-color)]">
                    <span className="truncate text-[var(--text-ink)]">{p.name}</span>
                    <span className="font-mono font-semibold text-[var(--primary-main)]">
                      {formatPaise(splitCalculation.allocations[p.id] || 0, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded-md border border-[var(--border-color)] min-h-[44px] sm:min-h-[36px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="app-btn-primary text-xs px-5"
            >
              {initialExpense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
