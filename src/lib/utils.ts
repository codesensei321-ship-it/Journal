import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { JournalBlock, JournalEntry, DayInfo, DayStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTodayDateString(): string {
  const today = new Date();
  return formatDateToISO(today);
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatFriendlyDate(dateString: string): string {
  if (!dateString) return '';
  const date = parseISODate(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  const date = parseISODate(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function isFutureDate(dateString: string): boolean {
  const todayStr = getTodayDateString();
  return dateString > todayStr;
}

export function isPastDate(dateString: string): boolean {
  const todayStr = getTodayDateString();
  return dateString < todayStr;
}

export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

export function countWordsInBlocks(blocks: JournalBlock[]): number {
  let total = 0;
  for (const b of blocks) {
    if (b.content) {
      const words = b.content.trim().split(/\s+/).filter(Boolean);
      total += words.length;
    }
  }
  return total;
}

export function getCalendarGrid(year: number, monthIndex: number, entriesMap: Map<string, JournalEntry>): DayInfo[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Previous month trailing days
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  const days: DayInfo[] = [];

  const todayStr = getTodayDateString();

  // Add leading days from previous month
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const prevDate = new Date(year, monthIndex - 1, dayNum);
    const dateStr = formatDateToISO(prevDate);
    const hasEntry = entriesMap.has(dateStr) && (entriesMap.get(dateStr)?.blocks.length ?? 0) > 0;
    
    let status: DayStatus = 'skipped';
    if (dateStr > todayStr) {
      status = 'future';
    } else if (hasEntry) {
      status = 'written';
    } else if (dateStr === todayStr) {
      status = hasEntry ? 'written' : 'skipped';
    }

    days.push({
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isPast: dateStr < todayStr,
      hasEntry,
      status,
      entry: entriesMap.get(dateStr),
    });
  }

  // Add days of current month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const currDate = new Date(year, monthIndex, dayNum);
    const dateStr = formatDateToISO(currDate);
    const hasEntry = entriesMap.has(dateStr) && (entriesMap.get(dateStr)?.blocks.some(b => b.content.trim().length > 0) ?? false);
    
    let status: DayStatus = 'skipped';
    if (dateStr > todayStr) {
      status = 'future';
    } else if (hasEntry) {
      status = 'written';
    } else if (dateStr === todayStr) {
      status = hasEntry ? 'written' : 'today';
    }

    days.push({
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isPast: dateStr < todayStr,
      hasEntry,
      status,
      entry: entriesMap.get(dateStr),
    });
  }

  // Add trailing days for complete 6-row or 5-row grid (total multiple of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, monthIndex + 1, i);
    const dateStr = formatDateToISO(nextDate);
    const hasEntry = entriesMap.has(dateStr) && (entriesMap.get(dateStr)?.blocks.some(b => b.content.trim().length > 0) ?? false);
    
    let status: DayStatus = 'skipped';
    if (dateStr > todayStr) {
      status = 'future';
    } else if (hasEntry) {
      status = 'written';
    }

    days.push({
      dateString: dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isPast: dateStr < todayStr,
      hasEntry,
      status,
      entry: entriesMap.get(dateStr),
    });
  }

  return days;
}

export function calculateWritingStats(entries: JournalEntry[]) {
  const validEntries = entries.filter(e => e.blocks && e.blocks.some(b => b.content.trim().length > 0));
  const writtenDates = new Set(validEntries.map(e => e.date));
  
  let currentStreak = 0;
  let maxStreak = 0;
  let totalWords = 0;

  for (const entry of validEntries) {
    totalWords += entry.wordCount || countWordsInBlocks(entry.blocks);
  }

  // Calculate current streak from today or yesterday backwards
  let checkDate = new Date();
  const todayStr = formatDateToISO(checkDate);
  
  // If today is written, count from today, otherwise if yesterday is written count from yesterday
  if (!writtenDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = formatDateToISO(checkDate);
    if (writtenDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak historically
  const sortedDates = Array.from(writtenDates).sort();
  let tempStreak = 0;
  let prevTime: number | null = null;

  for (const dStr of sortedDates) {
    const curTime = parseISODate(dStr).getTime();
    if (prevTime === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curTime - prevTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
    prevTime = curTime;
  }

  return {
    totalEntries: validEntries.length,
    currentStreak,
    maxStreak: Math.max(maxStreak, currentStreak),
    totalWords,
    averageWordsPerEntry: validEntries.length > 0 ? Math.round(totalWords / validEntries.length) : 0,
  };
}
