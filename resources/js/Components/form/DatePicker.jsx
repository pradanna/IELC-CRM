import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export default function DatePicker({ 
    value, 
    onChange, 
    placeholder = "Select date",
    id,
    label,
    className = "",
    inputClassName = "",
    minYear = 1945,
    maxYear = new Date().getFullYear() + 10,
    required = false
}) {
    // Local state for navigation (month and year)
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    
    // Internal values
    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    // Re-sync viewDate when value changes externally (and it exists)
    useEffect(() => {
        if (value) {
            setViewDate(new Date(value));
        }
    }, [value]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateYears = () => {
        let years = [];
        for (let i = maxYear; i >= minYear; i--) {
            years.push(i);
        }
        return years;
    };

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleDateSelect = (day, close) => {
        const selectedDate = new Date(currentYear, currentMonth, day);
        // Correct for timezone offset to prevent shifting when stringifying
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        
        const dateString = `${year}-${month}-${d}`;
        onChange(dateString);
        close();
    };

    const nextMonth = () => {
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const prevMonth = () => {
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleMonthChange = (e) => {
        setViewDate(new Date(currentYear, parseInt(e.target.value), 1));
    };

    const handleYearChange = (e) => {
        setViewDate(new Date(parseInt(e.target.value), currentMonth, 1));
    };

    const renderCalendar = (close) => {
        const totalDays = daysInMonth(currentMonth, currentYear);
        const startDay = firstDayOfMonth(currentMonth, currentYear);
        const days = [];

        // Padding for the start of the month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
        }

        // Days of the month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const selectedDate = value ? new Date(value) : null;
        if (selectedDate) selectedDate.setHours(0,0,0,0);

        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const isToday = today.getTime() === dateObj.getTime();
            const isSelected = selectedDate && selectedDate.getTime() === dateObj.getTime();

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day, close)}
                    className={`
                        h-9 w-9 rounded-lg text-sm flex items-center justify-center transition-all
                        ${isSelected 
                            ? 'bg-primary-600 text-white font-semibold' 
                            : isToday 
                                ? 'bg-primary-50 text-primary-600 font-bold border border-primary-200' 
                                : 'text-gray-700 hover:bg-gray-100'
                        }
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className={`relative ${className}`}>
            <Popover className="relative w-full">
                {({ open, close }) => (
                    <>
                                <Popover.Button
                                    id={id}
                                    className={`
                                        flex items-center justify-between w-full px-3 py-2 text-sm text-left bg-white border rounded-lg shadow-sm cursor-pointer
                                        transition-all duration-200 outline-none
                                        ${open ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-gray-200 hover:border-gray-300'}
                                        ${!value ? 'text-gray-400' : 'text-gray-900 font-medium'}
                                        ${inputClassName}
                                    `}
                        >
                            <span className="truncate">{value ? formatDateDisplay(value) : placeholder}</span>
                            <CalendarIcon className="w-4 h-4 text-gray-400" />
                        </Popover.Button>

                        <Transition
                            as={React.Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <Popover.Panel className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-[310px] sm:w-[320px]">
                                {/* Header: Year & Month Selectors */}
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-1 flex-1">
                                        <select
                                            value={currentMonth}
                                            onChange={handleMonthChange}
                                            className="block w-full py-1 pl-2 pr-6 text-xs font-semibold text-gray-700 bg-gray-50 border-transparent rounded-lg focus:ring-0 focus:border-transparent hover:bg-gray-100 transition-colors cursor-pointer appearance-none"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                backgroundPosition: 'right 0.25rem center',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundSize: '1.25em 1.25em',
                                            }}
                                        >
                                            {months.map((m, i) => (
                                                <option key={m} value={i}>{m}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={currentYear}
                                            onChange={handleYearChange}
                                            className="block w-full py-1 pl-2 pr-6 text-xs font-semibold text-gray-700 bg-gray-50 border-transparent rounded-lg focus:ring-0 focus:border-transparent hover:bg-gray-100 transition-colors cursor-pointer appearance-none"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                backgroundPosition: 'right 0.25rem center',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundSize: '1.25em 1.25em',
                                            }}
                                        >
                                            {generateYears().map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="flex items-center gap-0.5 ml-1">
                                        <button
                                            type="button"
                                            onClick={prevMonth}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextMonth}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Weekday Labels */}
                                <div className="grid grid-cols-7 mb-2">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                        <div key={day} className="h-9 w-9 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-0.5">
                                    {renderCalendar(close)}
                                </div>
                                
                                {value && (
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange("");
                                                close();
                                            }}
                                            className="text-xs font-semibold text-red-500 hover:text-red-600 py-1 px-2 rounded hover:bg-red-50 transition-all"
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                )}
                            </Popover.Panel>
                        </Transition>
                    </>
                )}
            </Popover>
        </div>
    );
}
