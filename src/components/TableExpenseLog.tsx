import React, { useState, useMemo } from 'react';
import type { Expense, Person, Category } from '../types';
import { formatPaise } from '../utils/currency';
import { Search, Edit2, Trash2, ArrowUpDown } from 'lucide-react';

interface TableExpenseLogProps {
  expenses: Expense[];
  participants: Person[];
  currency: string;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORIES: Category[] = ['Fuel', 'Food', 'Toll', 'Parking', 'Stay', 'Other'];

export const TableExpenseLog: React.FC<TableExpenseLogProps> = ({
  expenses,
  participants,
  currency,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'index' | 'amount' | 'description' | 'date'>('index');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const personMap = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach(p => map.set(p.id, p.name));
    return map;
  }, [participants]);

  const filteredAndSortedExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPerson = selectedPersonFilter === 'all' || exp.paidBy === selectedPersonFilter;
        const matchesCategory = selectedCategoryFilter === 'all' || exp.category === selectedCategoryFilter;
        return matchesSearch && matchesPerson && matchesCategory;
      })
      .map((exp, originalIdx) => ({ exp, index: originalIdx + 1 }))
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'index') diff = a.index - b.index;
        else if (sortField === 'amount') diff = a.exp.amountPaise - b.exp.amountPaise;
        else if (sortField === 'description') diff = a.exp.description.localeCompare(b.exp.description);
        else if (sortField === 'date') diff = new Date(a.exp.date).getTime() - new Date(b.exp.date).getTime();

        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [expenses, searchQuery, selectedPersonFilter, selectedCategoryFilter, sortField, sortOrder]);

  const totalFilteredPaise = useMemo(() => {
    return filteredAndSortedExpenses.reduce((acc, item) => acc + item.exp.amountPaise, 0);
  }, [filteredAndSortedExpenses]);

  const toggleSort = (field: 'index' | 'amount' | 'description' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Header */}
      <div className="app-card p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="app-input pl-9 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Person Filter */}
          <div className="relative">
            <select
              value={selectedPersonFilter}
              onChange={e => setSelectedPersonFilter(e.target.value)}
              className="app-input text-xs sm:text-sm py-1.5 min-h-[40px] pr-8"
            >
              <option value="all">All People</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  Paid by: {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="app-input text-xs sm:text-sm py-1.5 min-h-[40px] pr-8"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                <th 
                  className="py-3 px-4 w-12 text-center cursor-pointer hover:text-[var(--text-ink)]"
                  onClick={() => toggleSort('index')}
                >
                  <div className="flex items-center justify-center gap-1">
                    #
                    <ArrowUpDown className="w-3 h-3 inline" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-[var(--text-ink)]"
                  onClick={() => toggleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Expense
                    <ArrowUpDown className="w-3 h-3 inline" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-ink)]"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <ArrowUpDown className="w-3 h-3 inline" />
                  </div>
                </th>
                <th className="py-3 px-4">Paid By</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredAndSortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                    <p className="text-base font-medium">No expenses found</p>
                    <p className="text-xs mt-1">Try changing filters or add your first expense below.</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedExpenses.map(({ exp, index }) => {
                  const paidByName = personMap.get(exp.paidBy) || 'Unknown';
                  return (
                    <tr
                      key={exp.id}
                      onClick={() => onEditExpense(exp)}
                      className="hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-center text-[var(--text-muted)] font-mono text-xs">
                        {index}
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text-ink)]">
                        <div className="flex items-center gap-2">
                          <span>{exp.description}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] bg-[var(--bg-main)]">
                            {exp.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold font-mono tabular-nums text-[var(--text-ink)]">
                        {formatPaise(exp.amountPaise, currency)}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-ink)] font-medium">
                        {paidByName}
                      </td>
                      <td 
                        className="py-3 px-4 text-right"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditExpense(exp)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--primary-main)] rounded-md hover:bg-[var(--primary-light)]"
                            title="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(exp.id)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--negative-main)] rounded-md hover:bg-[var(--negative-bg)]"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Row matching reference tables */}
            {filteredAndSortedExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-[var(--bg-main)] font-bold border-t-2 border-[var(--border-color)] text-[var(--text-ink)]">
                  <td className="py-3.5 px-4 text-center font-mono text-xs">Total</td>
                  <td className="py-3.5 px-4 text-sm font-semibold">
                    {expenses.length} total expenses
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-base text-[var(--primary-main)]">
                    {formatPaise(totalFilteredPaise, currency)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
