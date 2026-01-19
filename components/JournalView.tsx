import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface JournalViewProps {
  journalEntries: JournalEntry[];
}

export const JournalView: React.FC<JournalViewProps> = ({ journalEntries }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Create a map of dates to journal entries
  const journalMap = useMemo(() => {
    const map: Record<string, JournalEntry> = {};
    journalEntries.forEach(entry => {
      map[entry.date] = entry;
    });
    return map;
  }, [journalEntries]);

  // Get days in current month
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null as any);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDateKey = (date: Date) => {
    return date.toLocaleDateString();
  };

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey);
  };

  const handleDateDoubleClick = (dateKey: string) => {
    setSelectedDate(dateKey);
    setIsFullscreen(true);
  };

  const selectedEntry = selectedDate ? journalMap[selectedDate] : null;
  const today = new Date().toLocaleDateString();

  // Fullscreen mode
  if (isFullscreen && selectedDate) {
    return (
      <div className="fixed inset-0 z-50 bg-white animate-in fade-in duration-300">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${selectedEntry ? 'bg-red-500' : 'bg-slate-300'}`} />
              <span className="text-lg font-medium text-slate-700">{selectedDate}</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              {selectedEntry ? (
                <p className="text-slate-600 text-lg leading-relaxed font-light whitespace-pre-wrap">
                  {selectedEntry.content}
                </p>
              ) : (
                <p className="text-slate-400 font-light text-center py-20">
                  No journal entry for this day yet :)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12">
      <div className="flex gap-12">
        {/* Left: Calendar */}
        <div className="w-72 flex-shrink-0">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPrevMonth}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-sm font-medium text-slate-700">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] text-slate-400 font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Dots */}
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((date, i) => {
              if (!date) {
                return <div key={`empty-${i}`} className="h-8 flex items-center justify-center" />;
              }

              const dateKey = formatDateKey(date);
              const hasJournal = !!journalMap[dateKey];
              const isSelected = selectedDate === dateKey;
              const isToday = dateKey === today;

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDateClick(dateKey)}
                  onDoubleClick={() => handleDateDoubleClick(dateKey)}
                  className={`h-8 flex items-center justify-center transition-all duration-200 rounded-full
                    ${isSelected ? 'scale-125' : 'hover:scale-110'}
                  `}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200
                      ${hasJournal
                        ? isSelected
                          ? 'bg-red-500 ring-2 ring-red-200'
                          : 'bg-red-500 hover:bg-red-600'
                        : isToday
                          ? 'bg-slate-300 ring-2 ring-slate-200'
                          : 'bg-slate-200 hover:bg-slate-300'
                      }
                    `}
                  />
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-300 mt-4 text-center">double-click for fullscreen</p>
        </div>

        {/* Right: Journal Entry */}
        <div className="flex-1 min-w-0">
          {selectedDate ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${selectedEntry ? 'bg-red-500' : 'bg-slate-300'}`} />
                <span className="text-sm font-medium text-slate-500">{selectedDate}</span>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 max-h-[60vh] overflow-y-auto">
                {selectedEntry ? (
                  <p className="text-slate-600 leading-relaxed font-light whitespace-pre-wrap">
                    {selectedEntry.content}
                  </p>
                ) : (
                  <p className="text-slate-400 font-light text-center py-8">
                    No journal entry for this day yet :)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-300 font-light">tap a dot to see the journal entry</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
