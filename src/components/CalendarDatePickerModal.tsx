import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface CalendarDatePickerModalProps {
  isOpen: boolean;
  selectedDate?: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  isOpen,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  if (!isOpen) return null;

  const today = new Date();
  const initialDate = selectedDate ? new Date(selectedDate) : today;
  const validInitialDate = isNaN(initialDate.getTime()) ? today : initialDate;

  const [currentYear, setCurrentYear] = useState<number>(validInitialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(validInitialDate.getMonth()); // 0-11
  const [tempSelectedDate, setTempSelectedDate] = useState<string>(
    selectedDate || today.toISOString().split('T')[0]
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Generate days for calendar grid
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean; dateStr: string }> = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    calendarDays.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      dateStr: `${y}-${mStr}-${dStr}`,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    calendarDays.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
      dateStr: `${currentYear}-${mStr}-${dStr}`,
    });
  }

  // Next month leading days to complete full weeks (up to 42 cells)
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  const remainingCells = totalCells - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    calendarDays.push({
      day: d,
      month: m,
      year: y,
      isCurrentMonth: false,
      dateStr: `${y}-${mStr}-${dStr}`,
    });
  }

  const todayStr = today.toISOString().split('T')[0];

  const handleOk = () => {
    onSelectDate(tempSelectedDate);
    onClose();
  };

  return (
    <div
      style={{ fontFamily: "'Calibri', sans-serif" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white border-[2px] border-[#0F172A] rounded-[18px] shadow-[0_12px_30px_rgba(0,0,0,0.12)] w-[335px] p-[16px] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Month-Year Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
                display: 'inline-block',
                transform: 'scaleY(1.22)',
              }}
              className="text-[17px] font-black text-slate-950 tracking-wide"
            >
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-950 stroke-[3]" />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-[36px] h-[36px] flex items-center justify-center text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-[36px] h-[36px] flex items-center justify-center text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Weekdays Header ("S M T W T F S") */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {WEEKDAYS.map((wd, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: "'Calibri', sans-serif",
                fontWeight: 900,
                WebkitTextStroke: '0.35px currentColor',
                transform: 'scaleY(1.22)',
              }}
              className="text-[16px] font-black text-slate-950 leading-none py-1"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7 gap-[4px] mb-5">
          {calendarDays.map((item, idx) => {
            const isSelected = tempSelectedDate === item.dateStr;
            const isToday = todayStr === item.dateStr;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setTempSelectedDate(item.dateStr)}
                style={{
                  fontFamily: "'Calibri', sans-serif",
                  fontWeight: 900,
                  WebkitTextStroke: '0.35px currentColor',
                }}
                className={`w-[40px] h-[40px] rounded-full mx-auto flex items-center justify-center text-[16px] font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB] text-[#FFFFFF] shadow-sm'
                    : isToday
                    ? 'border-[2px] border-[#2563EB] text-[#2563EB] bg-transparent'
                    : item.isCurrentMonth
                    ? 'text-slate-950 hover:bg-slate-100'
                    : 'text-[#94A3B8] hover:bg-slate-100'
                }`}
              >
                <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
                  {item.day}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons at Bottom (NO boxes, NO borders, NO backgrounds) */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.35px currentColor',
            }}
            className="text-[17px] font-black text-[#DC2626] hover:text-red-700 uppercase tracking-wide cursor-pointer bg-transparent border-none p-0"
          >
            <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
              CANCEL
            </span>
          </button>
          <button
            type="button"
            onClick={handleOk}
            style={{
              fontFamily: "'Calibri', sans-serif",
              fontWeight: 900,
              WebkitTextStroke: '0.35px currentColor',
            }}
            className="text-[17px] font-black text-[#2563EB] hover:text-blue-700 uppercase tracking-wide cursor-pointer bg-transparent border-none p-0"
          >
            <span style={{ display: 'inline-block', transform: 'scaleY(1.22)' }}>
              OK
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
