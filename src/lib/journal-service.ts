import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry, UserSession, AppSettings } from '../types';
import { countWordsInBlocks } from './utils';

const COLLECTION_NAME = 'journal_entries';
const LOCAL_STORAGE_CACHE = 'zaid_journal_cache_v2';
const STORAGE_KEY_SESSION = 'zaid_journal_auth_session';
const STORAGE_KEY_SETTINGS = 'zaid_journal_settings';

// Hardcoded authentication credentials as requested by user
export const VALID_USER = {
  username: 'Zaid_Journal',
  password: 'Zaid_Journal_Password',
  name: 'Zaid',
  email: 'zaid@journal.app',
};

export const HARDCODED_CREDENTIALS = VALID_USER;

// Authentication
export function authenticateUser(userOrEmail: string, pass: string): UserSession | null {
  const normalizedInput = userOrEmail.trim().toLowerCase();
  const validUsername = VALID_USER.username.toLowerCase();
  const validEmail = VALID_USER.email.toLowerCase();

  if (
    (normalizedInput === validUsername || normalizedInput === validEmail) &&
    pass === VALID_USER.password
  ) {
    const session: UserSession = {
      username: VALID_USER.username,
      name: VALID_USER.name,
      isAuthenticated: true,
      loginTime: Date.now(),
    };
    saveAuthSession(session);
    return session;
  }
  return null;
}

export function getAuthSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isAuthenticated) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Auth session parse error', e);
  }
  return null;
}

export function saveAuthSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch (e) {
    console.error('Save session error', e);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } catch (e) {
    console.error('Clear session error', e);
  }
}

// ----------------------------------------------------
// Firestore Real-Time Journal Data Management (0 Scratch)
// ----------------------------------------------------

// Subscribe to real-time updates from Firestore
export function subscribeToEntries(callback: (entries: Record<string, JournalEntry>) => void): () => void {
  try {
    const entriesRef = collection(db, COLLECTION_NAME);
    const q = query(entriesRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entriesMap: Record<string, JournalEntry> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JournalEntry;
          if (data && data.date) {
            entriesMap[data.date] = {
              ...data,
              id: data.id || docSnap.id,
            };
          }
        });
        
        // Cache to local storage for instant offline loading
        saveLocalCache(entriesMap);
        callback(entriesMap);
      },
      (error) => {
        console.warn('Firestore real-time subscription error, using local cache:', error);
        callback(getLocalCache());
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to initialize Firestore listener:', error);
    callback(getLocalCache());
    return () => {};
  }
}

// Save or update an entry in Firestore
export async function saveEntryToFirestore(entry: JournalEntry): Promise<void> {
  try {
    const words = countWordsInBlocks(entry.blocks || []);
    const sanitizedEntry: JournalEntry = {
      id: entry.date,
      date: entry.date,
      title: entry.title || '',
      icon: entry.icon || '📝',
      coverImage: entry.coverImage || '',
      blocks: entry.blocks || [],
      mood: entry.mood,
      tags: entry.tags || [],
      weather: entry.weather || '',
      wordCount: words,
      readingTime: Math.max(1, Math.ceil(words / 200)),
      createdAt: entry.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // 1. Update local cache immediately for zero latency
    const cache = getLocalCache();
    cache[sanitizedEntry.date] = sanitizedEntry;
    saveLocalCache(cache);

    // 2. Persist to Firestore document
    const docRef = doc(db, COLLECTION_NAME, sanitizedEntry.date);
    await setDoc(docRef, sanitizedEntry, { merge: true });
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
}

// Delete an entry from Firestore
export async function deleteEntryFromFirestore(dateStr: string): Promise<void> {
  try {
    // 1. Update local cache
    const cache = getLocalCache();
    delete cache[dateStr];
    saveLocalCache(cache);

    // 2. Delete from Firestore
    const docRef = doc(db, COLLECTION_NAME, dateStr);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document from Firestore:', error);
    throw error;
  }
}

// Local cache helpers
export function getLocalCache(): Record<string, JournalEntry> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading local journal cache', e);
  }
  return {}; // 0 scratch - no hardcoded mock entries
}

export function saveLocalCache(entries: Record<string, JournalEntry>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving local journal cache', e);
  }
}

// App Settings
const DEFAULT_SETTINGS: AppSettings = {
  font: 'sans',
  theme: 'dark',
  autoSaveInterval: 2,
  soundEffects: false,
};

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveAppSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving settings', e);
  }
  return updated;
}
