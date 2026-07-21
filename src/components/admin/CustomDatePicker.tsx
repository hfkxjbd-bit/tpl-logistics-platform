import React, { useState, useEffect } from "react";

interface CustomDatePickerProps {
  value: string; // Format: YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
  required?: boolean;
}

export default function CustomDatePicker({
  value,
  onChange,
  label,
  required = false
}: CustomDatePickerProps) {
  // Parse initial YYYY-MM-DD
  const today = new Date();
  const defaultYear = today.getFullYear();
  const defaultMonth = today.getMonth() + 1;
  const defaultDay = today.getDate();

  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);
  const [day, setDay] = useState<number>(defaultDay);

  // Sync state if value prop changes
  useEffect(() => {
    if (value && value.includes("-")) {
      const parts = value.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);

      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setYear(y);
        setMonth(m);
        setDay(d);
      }
    }
  }, [value]);

  // Helper to determine if a year is a leap year
  const isLeapYear = (y: number): boolean => {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  };

  // Get max days in a month/year
  const getMaxDays = (m: number, y: number): number => {
    if ([1, 3, 5, 7, 8, 10, 12].includes(m)) return 31;
    if ([4, 6, 9, 11].includes(m)) return 30;
    if (m === 2) {
      return isLeapYear(y) ? 29 : 28;
    }
    return 31;
  };

  const currentYear = today.getFullYear();
  const years: number[] = [];
  // From 1970 to currentYear + 15 to automatically include future years
  for (let y = 1970; y <= currentYear + 15; y++) {
    years.push(y);
  }

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const maxDays = getMaxDays(month, year);
  const daysList: number[] = [];
  for (let d = 1; d <= maxDays; d++) {
    daysList.push(d);
  }

  // Adjust day if month length changed and current day is out of bounds
  useEffect(() => {
    if (day > maxDays) {
      setDay(maxDays);
      triggerChange(year, month, maxDays);
    }
  }, [month, year, maxDays]);

  const triggerChange = (y: number, m: number, d: number) => {
    const formattedMonth = m.toString().padStart(2, "0");
    const formattedDay = d.toString().padStart(2, "0");
    onChange(`${y}-${formattedMonth}-${formattedDay}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextY = parseInt(e.target.value, 10);
    setYear(nextY);
    const mDays = getMaxDays(month, nextY);
    const nextD = day > mDays ? mDays : day;
    if (day > mDays) setDay(nextD);
    triggerChange(nextY, month, nextD);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextM = parseInt(e.target.value, 10);
    setMonth(nextM);
    const mDays = getMaxDays(nextM, year);
    const nextD = day > mDays ? mDays : day;
    if (day > mDays) setDay(nextD);
    triggerChange(year, nextM, nextD);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextD = parseInt(e.target.value, 10);
    setDay(nextD);
    triggerChange(year, month, nextD);
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[11px] font-bold text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {/* Day Select */}
        <select
          value={day}
          onChange={handleDayChange}
          required={required}
          className="px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold focus:bg-white focus:border-gold-500 cursor-pointer"
        >
          {daysList.map((d) => (
            <option key={d} value={d}>
              {d.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        {/* Month Select */}
        <select
          value={month}
          onChange={handleMonthChange}
          required={required}
          className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold focus:bg-white focus:border-gold-500 cursor-pointer"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Year Select */}
        <select
          value={year}
          onChange={handleYearChange}
          required={required}
          className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold focus:bg-white focus:border-gold-500 cursor-pointer"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
