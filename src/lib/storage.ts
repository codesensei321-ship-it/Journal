import { JournalEntry, UserSession, FontPreference, ThemeMode, AppSettings } from '../types';
import { 
  subscribeToEntries as firebaseSubscribe, 
  saveEntryToFirestore, 
  deleteEntryFromFirestore, 
  getLocalCache,
  saveLocalCache,
  VALID_USER,
  HARDCODED_CREDENTIALS,
  authenticateUser,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  getAppSettings,
  saveAppSettings
} from './journal-service';

export {
  VALID_USER,
  HARDCODED_CREDENTIALS,
  authenticateUser,
  getAuthSession,
  saveAuthSession,
  clearAuthSession,
  getAppSettings,
  saveAppSettings,
  saveEntryToFirestore,
  deleteEntryFromFirestore
};

// 0 Scratch - returns live entries from Firestore or local persistent cache
export function getAllEntries(): Record<string, JournalEntry> {
  return getLocalCache();
}

export function getEntryByDate(dateStr: string): JournalEntry | null {
  const entries = getAllEntries();
  return entries[dateStr] || null;
}

export function saveEntry(entry: JournalEntry): Record<string, JournalEntry> {
  // Fire and forget Firestore async update
  saveEntryToFirestore(entry).catch((err) => {
    console.error('Firestore save background error:', err);
  });

  const cache = getLocalCache();
  cache[entry.date] = entry;
  saveLocalCache(cache);
  return cache;
}

export function deleteEntry(dateStr: string): Record<string, JournalEntry> {
  deleteEntryFromFirestore(dateStr).catch((err) => {
    console.error('Firestore delete background error:', err);
  });

  const cache = getLocalCache();
  delete cache[dateStr];
  saveLocalCache(cache);
  return cache;
}

export const subscribeToEntries = firebaseSubscribe;
