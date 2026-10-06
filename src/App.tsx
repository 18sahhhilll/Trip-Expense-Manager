import { useState, useEffect, useMemo } from 'react';
import type { Trip, Expense, PersonBalance, SettlementPayment } from './types';
import { storageService } from './services/storage';
import { calculateBalances } from './logic/balances';
import { calculateSettlementPlan } from './logic/settlement';
import { exportTripToExcel } from './logic/exportExcel';
import { formatFullSummaryText, formatSettlementText } from './logic/exportText';
import { formatPaise } from './utils/currency';

import { Header } from './components/Header';
import { TableExpenseLog } from './components/TableExpenseLog';
import { TableBalanceSummary } from './components/TableBalanceSummary';
import { TableSettlementPlan } from './components/TableSettlementPlan';
import { ExpenseModal } from './components/ExpenseModal';
import { TripSettingsModal } from './components/TripSettingsModal';
import { NewTripModal } from './components/NewTripModal';
import { BackupModal } from './components/BackupModal';

import { 
  Plus, 
  Receipt, 
  Scale, 
  Handshake, 
  Calendar, 
  Users, 
  CheckCircle2,
  Sparkles,
  Compass
} from 'lucide-react';

export function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settle'>('expenses');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isTripSettingsOpen, setIsTripSettingsOpen] = useState(false);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Load initial trips & theme
  useEffect(() => {
    const loadedTrips = storageService.getTrips();
    setTrips(loadedTrips);

    if (loadedTrips.length === 0) {
      // First time visit / empty memory -> open Create Trip modal
      setIsNewTripModalOpen(true);
    } else {
      const savedActiveId = storageService.getActiveTripId();
      if (savedActiveId && loadedTrips.some(t => t.id === savedActiveId)) {
        setActiveTripId(savedActiveId);
      } else {
        setActiveTripId(loadedTrips[0].id);
        storageService.setActiveTripId(loadedTrips[0].id);
      }
    }

    const theme = storageService.getTheme();
    setIsDarkMode(theme === 'dark');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const activeTrip = useMemo(() => {
    if (trips.length === 0) return null;
    return trips.find(t => t.id === activeTripId) || trips[0] || null;
  }, [trips, activeTripId]);

  // Live computed balances
  const balances: PersonBalance[] = useMemo(() => {
    if (!activeTrip) return [];
    return calculateBalances(activeTrip.participants, activeTrip.expenses);
  }, [activeTrip]);

  // Live computed settlement plan
  const settlements: SettlementPayment[] = useMemo(() => {
    if (!activeTrip) return [];
    return calculateSettlementPlan(balances, activeTrip.settledPayments || {});
  }, [balances, activeTrip]);

  const totalTripSpendPaise = useMemo(() => {
    if (!activeTrip) return 0;
    return activeTrip.expenses.reduce((acc, e) => acc + e.amountPaise, 0);
  }, [activeTrip]);

  // Handler: Select active trip
  const handleSelectTrip = (id: string) => {
    setActiveTripId(id);
    storageService.setActiveTripId(id);
  };

  // Handler: Save expense (Add / Edit)
  const handleSaveExpense = (expenseData: Omit<Expense, 'id' | 'tripId'> & { id?: string }) => {
    if (!activeTrip) return;

    let updatedExpenses: Expense[];
    if (expenseData.id) {
      // Edit existing
      updatedExpenses = activeTrip.expenses.map(e => {
        if (e.id === expenseData.id) {
          return { ...e, ...expenseData } as Expense;
        }
        return e;
      });
      showToast('Expense updated');
    } else {
      // Create new
      const newExp: Expense = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tripId: activeTrip.id,
        description: expenseData.description,
        amountPaise: expenseData.amountPaise,
        paidBy: expenseData.paidBy,
        date: expenseData.date,
        category: expenseData.category,
        splitConfig: expenseData.splitConfig,
        computedAllocations: expenseData.computedAllocations,
      };
      updatedExpenses = [newExp, ...activeTrip.expenses];
      showToast('New expense added');
    }

    const updatedTrip = { ...activeTrip, expenses: updatedExpenses };
    storageService.saveTrip(updatedTrip);
    setTrips(storageService.getTrips());
  };

  // Handler: Delete expense
  const handleDeleteExpense = (expenseId: string) => {
    if (!activeTrip) return;
    if (!window.confirm('Delete this expense?')) return;

    const updatedExpenses = activeTrip.expenses.filter(e => e.id !== expenseId);
    const updatedTrip = { ...activeTrip, expenses: updatedExpenses };
    storageService.saveTrip(updatedTrip);
    setTrips(storageService.getTrips());
    showToast('Expense deleted');
  };

  // Handler: Update Trip Details (settings/participants)
  const handleUpdateTrip = (updatedTrip: Trip) => {
    storageService.saveTrip(updatedTrip);
    setTrips(storageService.getTrips());
    showToast('Trip settings updated');
  };

  // Handler: Delete Trip
  const handleDeleteTrip = (tripId: string) => {
    const remainingTrips = storageService.deleteTrip(tripId);
    setTrips(remainingTrips);
    if (remainingTrips.length > 0) {
      setActiveTripId(remainingTrips[0].id);
    } else {
      setActiveTripId('');
    }
    showToast('Trip deleted');
  };

  // Handler: Create New Trip
  const handleCreateNewTrip = (newTrip: Trip) => {
    storageService.saveTrip(newTrip);
    storageService.setActiveTripId(newTrip.id);
    setTrips(storageService.getTrips());
    setActiveTripId(newTrip.id);
    showToast(`Trip "${newTrip.name}" created`);
  };

  // Handler: Load Sample Trip
  const handleLoadSampleTrip = () => {
    const sample = storageService.resetToSampleData();
    setTrips(storageService.getTrips());
    setActiveTripId(sample.id);
    showToast('Loaded 5-person sample road trip demo data');
  };

  // Handler: Toggle Settled status on a payment
  const handleToggleSettled = (paymentId: string) => {
    if (!activeTrip) return;
    const currentMap = activeTrip.settledPayments || {};
    const updatedMap = { ...currentMap, [paymentId]: !currentMap[paymentId] };

    const updatedTrip = { ...activeTrip, settledPayments: updatedMap };
    storageService.saveTrip(updatedTrip);
    setTrips(storageService.getTrips());
  };

  // Handler: Export Excel
  const handleExportExcel = () => {
    if (!activeTrip) return;
    exportTripToExcel(activeTrip, balances, settlements);
    showToast('Excel report downloaded (.xlsx)');
  };

  // Handler: Copy Full Summary
  const handleCopySummary = () => {
    if (!activeTrip) return;
    const text = formatFullSummaryText(activeTrip, balances, settlements);
    navigator.clipboard.writeText(text);
    showToast('Trip summary copied to clipboard');
  };

  // Handler: Copy Settlement Plan Text
  const handleCopySettlementText = () => {
    if (!activeTrip) return;
    const text = formatSettlementText(activeTrip, settlements);
    navigator.clipboard.writeText(text);
    showToast('Settlement plan copied for WhatsApp');
  };

  // Handler: Toggle Dark Mode
  const handleToggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    storageService.setTheme(next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-ink)] pb-24 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-[var(--text-ink)] text-[var(--bg-surface)] px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[var(--positive-main)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        trips={trips}
        activeTrip={activeTrip}
        onSelectTrip={handleSelectTrip}
        onOpenNewTripModal={() => setIsNewTripModalOpen(true)}
        onOpenSettingsModal={() => setIsTripSettingsOpen(true)}
        onLoadSampleTrip={handleLoadSampleTrip}
        onExportExcel={handleExportExcel}
        onCopySummary={handleCopySummary}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content Area */}
      {activeTrip ? (
        <main className="max-w-7xl mx-auto w-full px-4 pt-4 sm:pt-6 flex-1 space-y-4 sm:space-y-6">
          {/* Trip Overview Summary Banner */}
          <div className="app-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-ink)]">
                  {activeTrip.name}
                </h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]">
                  {activeTrip.currency}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                {(activeTrip.startDate || activeTrip.endDate) && (
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    {activeTrip.startDate || ''} {activeTrip.endDate ? `➔ ${activeTrip.endDate}` : ''}
                  </span>
                )}

                <span className="flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  {activeTrip.participants.length} Participants ({activeTrip.participants.map(p => p.name).join(', ')})
                </span>
              </div>
            </div>

            {/* Quick Stat Pill */}
            <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
              <div className="text-left sm:text-right">
                <span className="block text-[11px] uppercase font-semibold text-[var(--text-muted)]">
                  Total Expenses
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[var(--primary-main)]">
                  {formatPaise(totalTripSpendPaise, activeTrip.currency)}
                </span>
              </div>

              <button
                onClick={() => {
                  setEditingExpense(null);
                  setIsExpenseModalOpen(true);
                }}
                className="hidden sm:inline-flex app-btn-primary text-xs px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Expense
              </button>
            </div>
          </div>

          {/* Segmented Tab Navigation Controls */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1">
            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'expenses', label: 'Expenses Log', icon: Receipt, count: activeTrip.expenses.length },
                { id: 'balances', label: 'Balance Summary', icon: Scale, count: activeTrip.participants.length },
                { id: 'settle', label: 'Settle Up', icon: Handshake, count: settlements.length },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg transition-colors border-b-2 min-h-[44px] ${
                      isActive
                        ? 'border-[var(--primary-main)] text-[var(--primary-main)] bg-[var(--primary-light)]/50'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-ink)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-[var(--primary-main)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
              <span>Client-side ledger & fair share calculator</span>
            </div>
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'expenses' && (
            <TableExpenseLog
              expenses={activeTrip.expenses}
              participants={activeTrip.participants}
              currency={activeTrip.currency}
              onAddExpense={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              onEditExpense={exp => {
                setEditingExpense(exp);
                setIsExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'balances' && (
            <TableBalanceSummary
              balances={balances}
              currency={activeTrip.currency}
            />
          )}

          {activeTab === 'settle' && (
            <TableSettlementPlan
              settlements={settlements}
              participants={activeTrip.participants}
              currency={activeTrip.currency}
              onToggleSettled={handleToggleSettled}
              onCopySettlementText={handleCopySettlementText}
            />
          )}
        </main>
      ) : (
        /* Welcome Onboarding Screen when 0 trips exist in localStorage */
        <main className="max-w-xl mx-auto w-full px-4 pt-16 flex-1 flex flex-col items-center justify-center text-center">
          <div className="app-card p-8 space-y-6 w-full shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary-main)] flex items-center justify-center mx-auto border border-[var(--primary-main)]/20 shadow-xs">
              <Compass className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[var(--text-ink)] tracking-tight">
                No active trips found
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
                Create a new trip to start logging shared group expenses, computing fair member shares, and generating optimal settlement plans.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsNewTripModalOpen(true)}
                className="app-btn-primary text-sm px-6 w-full sm:w-auto font-semibold shadow-xs min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Trip
              </button>

              <button
                onClick={handleLoadSampleTrip}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-[var(--accent-main)]/30 bg-[var(--accent-light)] text-[var(--accent-main)] hover:opacity-90 transition-colors w-full sm:w-auto min-h-[44px] flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Try Sample Demo Data
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Sticky Bottom Bar for Mobile - Add Expense */}
      {activeTrip && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-[var(--bg-surface)] border-t border-[var(--border-color)] z-30 shadow-lg flex items-center justify-between gap-3">
          <div className="flex-1">
            <span className="block text-[10px] uppercase font-semibold text-[var(--text-muted)]">
              Total Spend
            </span>
            <span className="text-base font-bold font-mono text-[var(--primary-main)]">
              {formatPaise(totalTripSpendPaise, activeTrip.currency)}
            </span>
          </div>

          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="app-btn-primary text-sm font-semibold flex-1 justify-center shadow-md min-h-[48px]"
          >
            <Plus className="w-5 h-5 mr-1" />
            Add Expense
          </button>
        </div>
      )}

      {/* Modals */}
      {activeTrip && (
        <>
          <ExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => {
              setIsExpenseModalOpen(false);
              setEditingExpense(null);
            }}
            onSave={handleSaveExpense}
            participants={activeTrip.participants}
            currency={activeTrip.currency}
            initialExpense={editingExpense}
          />

          <TripSettingsModal
            isOpen={isTripSettingsOpen}
            onClose={() => setIsTripSettingsOpen(false)}
            trip={activeTrip}
            onUpdateTrip={handleUpdateTrip}
            onDeleteTrip={handleDeleteTrip}
          />
        </>
      )}

      <NewTripModal
        isOpen={isNewTripModalOpen}
        onClose={() => setIsNewTripModalOpen(false)}
        onCreateTrip={handleCreateNewTrip}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={() => {
          const loadedTrips = storageService.getTrips();
          setTrips(loadedTrips);
          const activeId = storageService.getActiveTripId();
          if (activeId) setActiveTripId(activeId);
        }}
      />
    </div>
  );
}
