import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Premium Select Component
 * Replaces native HTML select for high-end styling of the dropdown menu.
 */
export default function PremiumSelect({ 
    options = [], 
    value, 
    onChange, 
    placeholder = 'Select...', 
    icon: Icon,
    className = "" 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentValueStr = value !== null && value !== undefined ? String(value).toLowerCase() : '';
    const selectedOption  = options.find(opt => String(opt.value).toLowerCase() === currentValueStr);

    return (
        <div className={`relative group ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 w-full pl-3 pr-7 py-2 bg-slate-50/70 border border-slate-200/80 rounded-xl 
                    text-[10.5px] font-bold text-slate-700 tracking-normal
                    transition-all duration-200 outline-none
                    hover:border-slate-300 hover:bg-white
                    ${isOpen ? 'ring-2 ring-red-500/10 border-red-500/50 bg-white shadow-xs' : ''}
                `}
            >
                {Icon && <Icon size={14} className={`${isOpen ? 'text-red-500' : 'text-slate-400'} shrink-0 transition-colors`} />}
                <span className="truncate flex-1 text-left">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={13} className={`absolute right-2.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-500' : 'text-slate-400'}`} />
            </button>

            {/* Dropdown Menu (The modern part) */}
            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[200px] z-[100] animate-in fade-in zoom-in duration-200 slide-in-from-top-2 origin-top">
                    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {options.length === 0 ? (
                            <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic">
                                No options available
                            </div>
                        ) : (
                            options.map((option) => {
                                const isSelected = String(option.value).toLowerCase() === currentValueStr;
                                return (
                                    <div
                                        key={option.value}
                                        onClick={() => { onChange(option.value); setIsOpen(false); }}
                                        className={`
                                            flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all
                                            ${isSelected ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                        `}
                                    >
                                        {option.label}
                                        {isSelected && <Check size={12} />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
