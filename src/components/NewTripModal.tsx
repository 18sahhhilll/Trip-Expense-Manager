import React, { useState } from 'react';
import type { Trip, Person } from '../types';
import { X, Plus } from 'lucide-react';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (newTrip: Trip) => void;
}

export const NewTripModal: React.FC<NewTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
}) => {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [startDate, setStartDate] = useState('');
  const [endDate] = useState('');
  const [participantNames, setParticipantNames] = useState<string[]>(['Alex', 'Sam', 'Jordan', 'Taylor']);
  const [newPersonInput, setNewPersonInput] = useState('');

  if (!isOpen) return null;

  const handleAddParticipant = () => {
    const trimmed = newPersonInput.trim();
    if (trimmed && !participantNames.includes(trimmed)) {
      setParticipantNames([...participantNames, trimmed]);
      setNewPersonInput('');
    }
  };

  const handleRemoveParticipant = (idx: number) => {
    if (participantNames.length <= 2) return;
    setParticipantNames(participantNames.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (participantNames.length < 2) return;

    const participants: Person[] = participantNames.map((pName, index) => ({
      id: `p_new_${Date.now()}_${index}`,
      name: pName.trim(),
    }));

    const tripId = `trip_${Date.now()}`;
    const newTrip: Trip = {
      id: tripId,
      name: name.trim(),
      currency: currency.trim() || '₹',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      participants,
      expenses: [],
      settledPayments: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateTrip(newTrip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
          <h2 className="text-base font-semibold text-[var(--text-ink)]">
            Create New Trip
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded-md min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Trip Name
            </label>
            <input
              type="text"
              placeholder="e.g. Goa Trip, Weekend Trek"
              value={name}
              onChange={e => setName(e.target.value)}
              className="app-input text-sm font-medium"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Currency
              </label>
              <input
                type="text"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="app-input text-sm font-mono text-center"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="app-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
              Participants ({participantNames.length})
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Participant name..."
                value={newPersonInput}
                onChange={e => setNewPersonInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
                className="app-input text-sm flex-1"
              />
              <button
                type="button"
                onClick={handleAddParticipant}
                className="app-btn-primary text-xs px-3"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {participantNames.map((pName, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[var(--primary-light)] text-[var(--primary-main)] border border-[var(--primary-main)]/20"
                >
                  {pName}
                  {participantNames.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="hover:text-[var(--negative-main)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] rounded-md border border-[var(--border-color)] min-h-[44px] sm:min-h-[36px]"
            >
              Cancel
            </button>
            <button type="submit" className="app-btn-primary text-xs px-5">
              Create Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
