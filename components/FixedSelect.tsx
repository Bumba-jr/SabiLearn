'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    logo?: string;
}

interface FixedSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    searchable?: boolean;
    accentColor?: string; // tailwind color class fragments, defaults to orange
}

// A select whose dropdown renders through a portal with viewport-fixed
// positioning: never clipped by ancestor overflow, tracks the field on
// scroll/resize, and flips upward near the bottom of the screen.
export function FixedSelect({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    disabled = false,
    searchable = true,
    accentColor = '#FF6B35',
}: FixedSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0, openUp: false });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const filtered = searchable && searchQuery
        ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    const updatePosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const EST_HEIGHT = 300;
        const openUp = rect.bottom + EST_HEIGHT > window.innerHeight && rect.top > EST_HEIGHT;
        const width = Math.max(rect.width, 200);
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
        setPos({ top: openUp ? rect.top - 8 : rect.bottom + 8, left, width, openUp });
    };

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    useEffect(() => {
        function onOutside(event: MouseEvent) {
            if (
                buttonRef.current?.contains(event.target as Node) ||
                panelRef.current?.contains(event.target as Node)
            ) return;
            setIsOpen(false);
            setSearchQuery('');
        }
        if (isOpen) {
            document.addEventListener('mousedown', onOutside);
            return () => document.removeEventListener('mousedown', onOutside);
        }
    }, [isOpen]);

    return (
        <div>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 rounded-lg border text-left font-inter transition-all flex items-center justify-between ${disabled
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-900 hover:border-[#FF6B35] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20'
                    }`}
            >
                <span className={`flex items-center gap-3 ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selectedOption?.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedOption.logo} alt={selectedOption.label} className="w-6 h-6 object-contain rounded" />
                    )}
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
            </button>

            {isOpen && !disabled && createPortal(
                <div
                    ref={panelRef}
                    style={{
                        position: 'fixed',
                        top: pos.openUp ? undefined : `${pos.top}px`,
                        bottom: pos.openUp ? `${window.innerHeight - pos.top}px` : undefined,
                        left: `${pos.left}px`,
                        width: `${pos.width}px`,
                        zIndex: 99999,
                    }}
                    className="bg-white border border-gray-200 rounded-lg shadow-2xl max-h-80 overflow-hidden"
                >
                    {searchable && (
                        <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    autoFocus
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-inter outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20"
                                />
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto max-h-56 py-2">
                        {filtered.length > 0 ? filtered.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => { onChange(option.value); setIsOpen(false); setSearchQuery(''); }}
                                className={`w-full px-4 py-2.5 text-left font-inter transition-colors flex items-center gap-3 ${option.value === value ? 'bg-orange-50 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                {option.logo && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={option.logo} alt={option.label} className="w-6 h-6 object-contain rounded flex-shrink-0" />
                                )}
                                <span className="flex-1" style={option.value === value ? { color: accentColor } : undefined}>{option.label}</span>
                                {option.value === value && <Check className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />}
                            </button>
                        )) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center font-inter">No results found</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
