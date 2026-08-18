export type BlockType = 
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider';

export interface JournalBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  calloutEmoji?: string;
  codeLanguage?: string;
  highlight?: string;
}

export type JournalMood = 'inspired' | 'great' | 'good' | 'neutral' | 'tired' | 'stressed';

export interface JournalEntry {
  id: string; // ISO date 'YYYY-MM-DD'
  date: string; // ISO date 'YYYY-MM-DD'
  title: string;
  icon?: string;
  coverImage?: string;
  blocks: JournalBlock[];
  mood?: JournalMood;
  tags: string[];
  weather?: string;
  wordCount: number;
  readingTime: number; // in minutes
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface UserSession {
  username: string;
  name: string;
  isAuthenticated: boolean;
  loginTime: number;
}

export type DayStatus = 'written' | 'skipped' | 'future' | 'today';

export interface DayInfo {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  isPast: boolean;
  hasEntry: boolean;
  status: DayStatus;
  entry?: JournalEntry;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  referencedDates?: string[];
  quotes?: {
    date: string;
    text: string;
  }[];
  isThinking?: boolean;
}

export type FontPreference = 'sans' | 'serif' | 'mono';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  font: FontPreference;
  theme: ThemeMode;
  autoSaveInterval: number;
  soundEffects: boolean;
}
