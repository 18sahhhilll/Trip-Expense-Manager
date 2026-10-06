import React, { useState, useEffect } from 'react';
import type { Trip, Person } from '../types';
import { X, Plus, Trash2, Edit2, AlertCircle, Check } from 'lucide-react';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripSettingsModal: React.FC<TripSettingsModalProps> = ({
  isOpen,
  onClose,
  trip,
  onUpdateTrip,
  onDeleteTrip,
}) => {
  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.startDate || '');
  const [endDate, setEndDate] = useState(trip.endDate || '');
  const [currency, setCurrency] = useState(trip.currency || '₹');
  const [participants, setParticipants] = useState<Person[]>(trip.participants);
  const [newPersonName, setNewPersonName] = useState('');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPersonName, setEditingPersonName] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    setName(trip.name);
    setStartDate(trip.startDate || '');
    setEndDate(trip.endDate || '');
    setCurrency(trip.currency || '₹');
    setParticipants(trip.participants);
    setWarningMessage('');
  }, [trip, isOpen]);

  if (!isOpen) return null;

  const handleSaveTripDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateTrip({
      ...trip,
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      currency: currency.trim() || '₹',
      participants,
    });
    onClose();
  };

  const handleAddParticipant = () => {
    const trimmed = newPersonName.trim();
    if (!trimmed) return;
    if (participants.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setWarningMessage(`Participant "${trimmed}" already exists in this trip.`);
      return;
    }

    const newPerson: Person = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
    };

    setParticipants([...participants, newPerson]);
    setNewPersonName('');
    setWarningMessage('');
  };

  const handleStartRenamePerson = (p: Person) => {
    setEditingPersonId(p.id);
    setEditingPersonName(p.name);
  };

  const handleSaveRenamePerson = (personId: string) => {
    const trimmed = editingPersonName.trim();
    if (!trimmed) return;
    setParticipants(participants.map(p => (p.id === personId ? { ...p, name: trimmed } : p)));
    setEditingPersonId(null);
    setEditingPersonName('');
  };

  const handleDeleteParticipant = (personId: string) => {
    const person = participants.find(p => p.id === personId);
    if (!person) return;

    // Check if participant is part of any expense (paidBy or computedAllocations > 0)
    const isAssigned = trip.expenses.some(e => {
      if (e.paidBy === personId) return true;
      if (e.computedAllocations && e.computedAllocations[personId] > 0) return true;
      return false;
    });

    if (isAssigned) {
      setWarningMessage(
        `Cannot delete "${person.name}" because they are involved in active expenses. Edit or remove their expenses first.`
      );
      return;
    }

    if (participants.length <= 2) {
      setWarningMessage('Trips must have at least 2 participants.');
      return;
    }

    setParticipants(participants.filter(p => p.id !== personId));
    setWarningMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] shadow-2xl overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
          <h2 className="text-base font-semibold text-[var(--text-ink)]">
            Trip Settings & Participants
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-ink)] rounded-md min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveTripDetails} className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {warningMessage && (
            <div className="p-3 bg-[var(--negative-bg)] text-[var(--negative-main)] rounded-md text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Trip Name & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Trip Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="app-input text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="app-input text-sm font-mono text-center"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
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

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="app-input text-sm"
              />
            </div>
          </div>

          <hr className="border-[var(--border-color)]" />

          {/* Participants Manager */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Participants ({participants.length})
            </h3>

            {/* Add Participant Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add new participant name..."
                value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
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
                className="app-btn-primary text-xs px-3 min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {participants.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]"
                >
                  {editingPersonId === p.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingPersonName}
                        onChange={e => setEditingPersonName(e.target.value)}
                        className="app-input text-xs py-1 h-8 flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRenamePerson(p.id)}
                        className="p-1 text-[var(--positive-main)] hover:bg-[var(--positive-bg)] rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-[var(--text-ink)]">{p.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartRenamePerson(p)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--primary-main)] rounded"
                          title="Rename participant"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteParticipant(p.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--negative-main)] rounded"
                          title="Delete participant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-[var(--border-color)]" />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${trip.name}"?`)) {
                  onDeleteTrip(trip.id);
                  onClose();
                }
              }}
              className="text-xs font-semibold text-[var(--negative-main)] hover:underline flex items-center gap-1 min-h-[44px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Trip
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] rounded-md border border-[var(--border-color)] min-h-[44px] sm:min-h-[36px]"
              >
                Cancel
              </button>
              <button type="submit" className="app-btn-primary text-xs px-4">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
