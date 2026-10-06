import type { Trip } from '../types';
import { getSampleTrip } from '../data/sampleData';

const TRIPS_KEY = 'tem_trips_v1';
const ACTIVE_TRIP_KEY = 'tem_active_trip_id_v1';
const THEME_KEY = 'tem_theme_v1';

export const storageService = {
  getTrips(): Trip[] {
    try {
      const data = localStorage.getItem(TRIPS_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as Trip[];
    } catch (e) {
      console.error('Error reading trips from localStorage', e);
      return [];
    }
  },

  saveTrips(trips: Trip[]): void {
    try {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    } catch (e) {
      console.error('Error saving trips to localStorage', e);
    }
  },

  getActiveTripId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_TRIP_KEY);
    } catch {
      return null;
    }
  },

  setActiveTripId(id: string): void {
    try {
      localStorage.setItem(ACTIVE_TRIP_KEY, id);
    } catch (e) {
      console.error('Error setting active trip id', e);
    }
  },

  getTripById(id: string): Trip | null {
    const trips = this.getTrips();
    return trips.find(t => t.id === id) || null;
  },

  saveTrip(updatedTrip: Trip): void {
    const trips = this.getTrips();
    const idx = trips.findIndex(t => t.id === updatedTrip.id);
    const updated = { ...updatedTrip, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      trips[idx] = updated;
    } else {
      trips.push(updated);
    }
    this.saveTrips(trips);
  },

  deleteTrip(tripId: string): Trip[] {
    let trips = this.getTrips();
    trips = trips.filter(t => t.id !== tripId);
    this.saveTrips(trips);
    if (trips.length > 0) {
      if (this.getActiveTripId() === tripId) {
        this.setActiveTripId(trips[0].id);
      }
    } else {
      localStorage.removeItem(ACTIVE_TRIP_KEY);
    }
    return trips;
  },

  resetToSampleData(): Trip {
    const sample = getSampleTrip();
    const existing = this.getTrips();
    const existingFiltered = existing.filter(t => t.id !== sample.id);
    const updatedTrips = [sample, ...existingFiltered];
    this.saveTrips(updatedTrips);
    this.setActiveTripId(sample.id);
    return sample;
  },

  exportBackupJSON(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      trips: this.getTrips(),
      activeTripId: this.getActiveTripId(),
    };
    return JSON.stringify(data, null, 2);
  },

  importBackupJSON(jsonContent: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed && Array.isArray(parsed.trips) && parsed.trips.length > 0) {
        this.saveTrips(parsed.trips);
        if (parsed.activeTripId) {
          this.setActiveTripId(parsed.activeTripId);
        } else {
          this.setActiveTripId(parsed.trips[0].id);
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to parse backup JSON', e);
    }
    return false;
  },

  getTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(THEME_KEY, theme);
  },
};
