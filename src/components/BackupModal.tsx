import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { X, Download, Upload, Check, AlertCircle } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadJSON = () => {
    const jsonStr = storageService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trip-expense-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'Backup downloaded successfully.' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      const success = storageService.importBackupJSON(content);
      if (success) {
        setStatusMessage({ type: 'success', text: 'Data imported successfully!' });
        onDataRestored();
      } else {
        setStatusMessage({ type: 'error', text: 'Invalid JSON backup format.' });
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = () => {
    if (!jsonText.trim()) return;
    const success = storageService.importBackupJSON(jsonText.trim());
    if (success) {
      setStatusMessage({ type: 'success', text: 'Data imported successfully!' });
      onDataRestored();
    } else {
      setStatusMessage({ type: 'error', text: 'Invalid JSON content provided.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
          <h2 className="text-base font-semibold text-[var(--text-ink)]">
            JSON Backup & Restore
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded-md min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {statusMessage && (
            <div className={`p-3 rounded-md text-xs font-medium flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-[var(--positive-bg)] text-[var(--positive-main)]' 
                : 'bg-[var(--negative-bg)] text-[var(--negative-main)]'
            }`}>
              {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Export section */}
          <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] space-y-2">
            <h3 className="text-xs font-semibold uppercase text-[var(--text-muted)]">
              Export Backup
            </h3>
            <p className="text-xs text-[var(--text-ink)]">
              Save all your trips, expenses, and settings to a JSON file to transfer between devices.
            </p>
            <button
              onClick={handleDownloadJSON}
              className="app-btn-primary text-xs w-full mt-1"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download Backup JSON
            </button>
          </div>

          {/* Import section */}
          <div className="p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] space-y-3">
            <h3 className="text-xs font-semibold uppercase text-[var(--text-muted)]">
              Restore from Backup
            </h3>
            
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-main)] rounded-lg cursor-pointer transition-colors bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] font-medium">
              <Upload className="w-4 h-4 text-[var(--primary-main)]" />
              <span>Choose Backup File (.json)</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="relative">
              <textarea
                placeholder="Or paste JSON backup string here..."
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                rows={3}
                className="app-input text-xs font-mono"
              />
            </div>

            {jsonText && (
              <button
                onClick={handleImportText}
                className="app-btn-primary text-xs w-full"
              >
                Import Pasted JSON
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
