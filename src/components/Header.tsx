import React, { useState } from 'react';
import type { Trip } from '../types';
import { 
  FileSpreadsheet, 
  Share2, 
  Moon, 
  Sun, 
  Plus, 
  Settings, 
  Database, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  trips: Trip[];
  activeTrip: Trip | null;
  onSelectTrip: (id: string) => void;
  onOpenNewTripModal: () => void;
  onOpenSettingsModal: () => void;
  onLoadSampleTrip: () => void;
  onExportExcel: () => void;
  onCopySummary: () => void;
  onOpenBackupModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  trips,
  activeTrip,
  onSelectTrip,
  onOpenNewTripModal,
  onOpenSettingsModal,
  onLoadSampleTrip,
  onExportExcel,
  onCopySummary,
  onOpenBackupModal,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: App Title & Trip Selector */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary-main)] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              ₹
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-[var(--text-ink)] leading-none">
                Trip Expense Manager
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">
                Client-side Ledger & Settlement
              </p>
            </div>
          </div>

          {/* Trip Picker Dropdown or Create Button */}
          {activeTrip ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-main)] text-sm font-medium text-[var(--text-ink)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px] md:min-h-[38px]"
                aria-expanded={showDropdown}
              >
                <span className="truncate max-w-[140px] sm:max-w-[180px]">
                  {activeTrip.name}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </button>

              {showDropdown && (
                <div 
                  className="absolute left-0 md:right-0 mt-1 w-64 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-lg py-1 z-40"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]">
                    Switch Trip
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {trips.map(t => (
                      <button
                        key={t.id}
                        onClick={() => onSelectTrip(t.id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[var(--bg-surface-hover)] ${
                          t.id === activeTrip.id ? 'font-semibold text-[var(--primary-main)] bg-[var(--primary-light)]' : 'text-[var(--text-ink)]'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-xs text-[var(--text-muted)] ml-2">
                          {t.participants.length} members
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-[var(--border-color)] p-1.5">
                    <button
                      onClick={onOpenNewTripModal}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[var(--primary-main)] hover:bg-[var(--primary-light)] rounded-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create New Trip
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenNewTripModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--primary-main)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors min-h-[44px] md:min-h-[36px]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Trip</span>
            </button>
          )}
        </div>

        {/* Right: Actions Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {activeTrip && (
            <>
              <button
                onClick={onOpenSettingsModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-color)] text-[var(--text-ink)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px] md:min-h-[36px] whitespace-nowrap"
                title="Edit trip details and members"
              >
                <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Trip Settings</span>
              </button>

              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary-main)] text-white hover:bg-[var(--primary-hover)] transition-colors min-h-[44px] md:min-h-[36px] whitespace-nowrap shadow-xs"
                title="Export full trip to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={onCopySummary}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border-color)] text-[var(--text-ink)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[44px] md:min-h-[36px] whitespace-nowrap"
                title="Copy trip summary for WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-[var(--accent-main)]" />
                <span>Copy Text</span>
              </button>
            </>
          )}

          <button
            onClick={onLoadSampleTrip}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-[var(--accent-light)] text-[var(--accent-main)] hover:opacity-90 transition-colors min-h-[44px] md:min-h-[36px] whitespace-nowrap border border-[var(--accent-main)]/20"
            title="Load the 5-person sample road trip demo data"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Data</span>
          </button>

          <button
            onClick={onOpenBackupModal}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded-md hover:bg-[var(--bg-surface-hover)] min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] flex items-center justify-center"
            title="Backup & Restore JSON"
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDarkMode}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded-md hover:bg-[var(--bg-surface-hover)] min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] flex items-center justify-center"
            title="Toggle Light / Dark theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
