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

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className={`relative group ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 w-full pl-5 pr-12 py-2.5 bg-gray-50/50 border border-gray-200/60 rounded-xl 
                    text-[10px] font-black text-slate-700 uppercase tracking-wider
                    transition-all duration-300 outline-none
                    hover:border-slate-300 hover:bg-white
                    ${isOpen ? 'ring-4 ring-red-500/5 border-red-500/40 bg-white shadow-sm' : ''}
                `}
            >
                {Icon && <Icon size={16} className={`${isOpen ? 'text-red-500' : 'text-slate-400'} transition-colors`} />}
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`absolute right-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-red-500' : 'text-slate-400'}`} />
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
                            <>
                                {/* Placeholder / Clear Option if needed */}
                                <div 
                                    onClick={() => { onChange(''); setIsOpen(false); }}
                                    className={`
                                        px-4 py-3  rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all
                                        ${!value ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}
                                    `}
                                >
                                    {placeholder}
                                </div>
                                {options.map((option) => {
                                    const isSelected = String(option.value) === String(value);
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
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
