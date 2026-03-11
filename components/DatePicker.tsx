'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    minAge?: number;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    required = false,
    minAge = 18
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - minAge);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [ageError, setAgeError] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    // Format display value
    const displayValue = value ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';

    // Calculate age
    const calculateAge = (birthDate: string): number => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday, 6 = Saturday)
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    // Update dropdown position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            if (
                containerRef.current &&
                !containerRef.current.contains(target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleDateSelect = (day: number) => {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const age = calculateAge(dateStr);

        if (age < minAge) {
            setAgeError(`You must be at least ${minAge} years old`);
            return;
        }

        setAgeError('');
        onChange(dateStr);
        setIsOpen(false);
    };

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

    return (
        <div ref={containerRef} className="relative">
            {/* Display Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 rounded-lg border border-gray-300 text-left flex items-center justify-between transition-all font-inter ${!displayValue ? 'text-gray-400' : 'text-gray-900'
                    } hover:border-[#FF6B35] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20`}
            >
                <span>{displayValue || placeholder}</span>
                <Calendar className="w-5 h-5 text-gray-400" />
            </button>

            {/* Age Error Message */}
            {ageError && (
                <p className="text-sm text-red-600 mt-1 font-inter">{ageError}</p>
            )}

            {/* Dropdown Calendar */}
            {isOpen && typeof window !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${Math.max(dropdownPosition.width, 320)}px`,
                        zIndex: 9999
                    }}
                    className="bg-white border border-gray-300 rounded-lg shadow-2xl p-4"
                >
                    {/* Month/Year Selector */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedMonth === 0) {
                                    setSelectedMonth(11);
                                    setSelectedYear(selectedYear - 1);
                                } else {
                                    setSelectedMonth(selectedMonth - 1);
                                }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="flex gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-inter focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none"
                            >
                                {months.map((month, index) => (
                                    <option key={month} value={index}>{month}</option>
                                ))}
                            </select>

                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-inter focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none"
                            >
                                {years.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                if (selectedMonth === 11) {
                                    setSelectedMonth(0);
                                    setSelectedYear(selectedYear + 1);
                                } else {
                                    setSelectedMonth(selectedMonth + 1);
                                }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {emptyDays.map((_, index) => (
                            <div key={`empty-${index}`} />
                        ))}
                        {days.map((day) => {
                            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isSelected = value === dateStr;
                            const age = calculateAge(dateStr);
                            const isUnderage = age < minAge;

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDateSelect(day)}
                                    disabled={isUnderage}
                                    className={`
                                        py-2 text-sm font-inter rounded-lg transition-colors
                                        ${isSelected
                                            ? 'bg-[#FF6B35] text-white font-semibold'
                                            : isUnderage
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'hover:bg-gray-100 text-gray-900'
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Age Requirement Notice */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center font-inter">
                            You must be at least {minAge} years old to register
                        </p>
                    </div>
                </div>,
                document.body
            )}

            {/* Hidden input for form validation */}
            {required && (
                <input
                    type="text"
                    value={value}
                    onChange={() => { }}
                    required
                    className="absolute opacity-0 pointer-events-none"
                    tabIndex={-1}
                />
            )}
        </div>
    );
}
