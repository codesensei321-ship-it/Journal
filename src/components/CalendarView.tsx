import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Flame
} from 'lucide-react';
import { JournalEntry } from '../types';
import { 
  getCalendarGrid, 
  getTodayDateString, 
  parseISODate,
  cn 
} from '../lib/utils';

interface CalendarViewProps {
  currentDateString: string;
  onSelectDate: (dateStr: string) => void;
  entries: Record<string, JournalEntry>;
  streakCount: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDateString,
  onSelectDate,
  entries,
  streakCount,
}) => {
  const currentDateObj = parseISODate(currentDateString);
  const [viewYear, setViewYear] = useState<number>(currentDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(currentDateObj.getMonth());

  const entriesMap = new Map<string, JournalEntry>(Object.entries(entries));
  const daysGrid = getCalendarGrid(viewYear, viewMonth, entriesMap);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(getTodayDateString());
  };

  // Calculate monthly stats
  const currentMonthDays = daysGrid.filter(d => d.isCurrentMonth);
  const writtenCount = currentMonthDays.filter(d => d.status === 'written').length;
  const pastDaysCount = currentMonthDays.filter(d => !d.isFuture).length;
  const consistencyPercent = pastDaysCount > 0 ? Math.round((writtenCount / pastDaysCount) * 100) : 0;

  return (
    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 shadow-xl text-slate-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Calendar
            </h3>
            <span className="text-xs text-indigo-400 font-medium">
              {monthNames[viewMonth].slice(0, 3)} {viewYear}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {writtenCount} of {pastDaysCount} days logged ({consistencyPercent}%)
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="text-[11px] font-medium px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-[#18181b] rounded-lg p-0.5 border border-white/5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-slate-600 font-bold mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {daysGrid.map((day, idx) => {
          const isSelected = day.dateString === currentDateString;
          const isFuture = day.isFuture;
          const isWritten = day.status === 'written';
          const isSkipped = day.status === 'skipped';
          const isTodayDate = day.isToday;

          return (
            <button
              key={`${day.dateString}-${idx}`}
              onClick={() => onSelectDate(day.dateString)}
              disabled={isFuture}
              className={cn(
                'relative h-8 w-full flex flex-col items-center justify-center rounded-md text-xs transition-all duration-150 border select-none',
                
                // Future days (Slate grey)
                isFuture && 'bg-slate-800/40 text-slate-600 border-transparent cursor-not-allowed opacity-40',
                
                // Written days (Green 20% + green 400 + green 500/30 border)
                isWritten && !isSelected && 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 hover:border-green-500/50',
                
                // Skipped days (Red 20% + red 400 + red 500/30 border)
                isSkipped && !isFuture && !isSelected && 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
                
                // Today default
                isTodayDate && !isSelected && !isWritten && 'bg-[#18181b] text-slate-200 border-white/20',
                
                // Active Selected Day (Indigo Ring Offset)
                isSelected && 'font-bold ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#09090b] z-10 shadow-md shadow-indigo-500/20',
                isSelected && isWritten && 'bg-green-500/30 text-green-300 border-green-400',
                isSelected && isSkipped && 'bg-red-500/30 text-red-300 border-red-400',
                isSelected && !isWritten && !isSkipped && 'bg-indigo-600 text-white border-indigo-500',

                // Dim non-current month
                !day.isCurrentMonth && !isFuture && 'opacity-40'
              )}
            >
              <span>{day.dayNumber}</span>
              {isTodayDate && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend & Stats */}
      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span className="text-slate-300 font-medium">Written</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-slate-300 font-medium">Skipped</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-700" />
            <span>Future</span>
          </div>
        </div>

        {streakCount > 0 && (
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{streakCount}d streak</span>
          </div>
        )}
      </div>
    </div>
  );
};
