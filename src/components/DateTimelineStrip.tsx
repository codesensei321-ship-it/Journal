import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { JournalEntry } from '../types';
import { 
  formatDateToISO, 
  parseISODate, 
  getTodayDateString, 
  isFutureDate, 
  cn 
} from '../lib/utils';

interface DateTimelineStripProps {
  currentDateString: string;
  onSelectDate: (dateStr: string) => void;
  entries: Record<string, JournalEntry>;
  onOpenCalendarModal: () => void;
}

export const DateTimelineStrip: React.FC<DateTimelineStripProps> = ({
  currentDateString,
  onSelectDate,
  entries,
  onOpenCalendarModal,
}) => {
  const currentDate = parseISODate(currentDateString);
  const todayStr = getTodayDateString();

  // Generate range of 7 days centered on current date
  const timelineDays: { dateStr: string; dayName: string; dayNum: number; isToday: boolean; isFuture: boolean; hasEntry: boolean }[] = [];
  
  for (let offset = -4; offset <= 2; offset++) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset);
    const dStr = formatDateToISO(d);
    const isFuture = dStr > todayStr;
    const hasEntry = Boolean(entries[dStr] && entries[dStr].blocks.some(b => b.content.trim().length > 0));
    
    timelineDays.push({
      dateStr: dStr,
      dayName: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
      dayNum: d.getDate(),
      isToday: dStr === todayStr,
      isFuture,
      hasEntry,
    });
  }

  const handleStepDay = (step: number) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + step);
    const nextStr = formatDateToISO(next);
    if (!isFutureDate(nextStr)) {
      onSelectDate(nextStr);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 bg-[#18181b] border border-white/10 rounded-2xl">
      {/* Prev Day Button */}
      <button
        type="button"
        onClick={() => handleStepDay(-1)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
        title="Previous Day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Days Strip */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-1 flex-1 justify-start sm:justify-center">
        {timelineDays.map((item) => {
          const isSelected = item.dateStr === currentDateString;
          const isWritten = item.hasEntry;
          const isSkipped = !item.hasEntry && !item.isFuture;

          return (
            <button
              key={item.dateStr}
              type="button"
              disabled={item.isFuture}
              onClick={() => onSelectDate(item.dateStr)}
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-xs transition-all duration-150 border shrink-0 select-none',
                
                // Future days
                item.isFuture && 'opacity-40 border-transparent bg-slate-800/40 cursor-not-allowed text-slate-600',
                
                // Written days (Green 20% + border green 500/30)
                isWritten && !isSelected && 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30',
                
                // Skipped days (Red 20% + border red 500/30)
                isSkipped && !item.isFuture && !isSelected && 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30',
                
                // Active Selected (Indigo glow & ring)
                isSelected && 'font-bold ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#09090b] shadow-md shadow-indigo-500/25',
                isSelected && isWritten && 'bg-green-500/30 text-green-300 border-green-400',
                isSelected && isSkipped && 'bg-red-500/30 text-red-300 border-red-400',
                isSelected && !isWritten && !isSkipped && 'bg-indigo-600 text-white border-indigo-500'
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                {item.dayName}
              </span>
              <span className="text-sm font-bold mt-0.5">
                {item.dayNum}
              </span>

              {item.isToday && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#18181b]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Next Day Button */}
      <button
        type="button"
        disabled={isFutureDate(formatDateToISO(new Date(currentDate.getTime() + 86400000)))}
        onClick={() => handleStepDay(1)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        title="Next Day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Full Calendar View trigger button */}
      <button
        type="button"
        onClick={onOpenCalendarModal}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-slate-300 transition-colors shrink-0"
      >
        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
        <span>Month Grid</span>
      </button>
    </div>
  );
};
