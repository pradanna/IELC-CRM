import React, { useState, useMemo } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Premium Searchable Select (Select2 Equivalent)
 * Uses Headless UI Combobox for robust accessibility and search logic.
 */
export default function PremiumSearchableSelect({ 
    options = [], 
    value, 
    onChange, 
    placeholder = 'Search...', 
    icon: Icon,
    className = "" 
}) {
    const [query, setQuery] = useState('');

    const filteredOptions = useMemo(() => {
        if (query === '') return options;
        return options.filter((option) => {
            return option.label.toLowerCase().includes(query.toLowerCase());
        });
    }, [query, options]);

    const selectedOption = useMemo(() => {
        return options.find(opt => String(opt.value) === String(value)) || null;
    }, [value, options]);

    return (
        <div className={`relative ${className}`}>
            <Combobox 
                value={selectedOption} 
                onChange={(val) => {
                    onChange(val ? val.value : '');
                    setQuery('');
                }}
                onClose={() => setQuery('')}
            >
                {({ open }) => (
                    <div className="relative">
                        {/* Trigger / Input */}
                        <div className={`
                            relative flex items-center w-full bg-white border ${open ? 'border-red-500 shadow-sm ring-4 ring-red-500/5' : 'border-slate-300 hover:border-slate-400'} 
                            rounded-2xl transition-all duration-300 outline-none shadow-sm
                        `}>
                            <ComboboxButton as="div" className="flex items-center w-full pl-5 pr-12 py-3 cursor-text">
                                {Icon && <Icon size={16} className={`mr-3 ${open ? 'text-red-500' : 'text-slate-400'} transition-colors`} />}
                                
                                <ComboboxInput
                                    className="w-full bg-transparent border-none p-0 text-[11px] font-black text-slate-700 uppercase tracking-wider focus:ring-0 outline-none placeholder:text-slate-400 placeholder:normal-case font-black uppercase tracking-wider"
                                    placeholder={placeholder}
                                    displayValue={(option) => option?.label || ''}
                                    onChange={(event) => setQuery(event.target.value)}
                                    // Clicking the input will focus it, and because it's inside ComboboxButton, it should toggle/open the list if not yet open.
                                />

                                <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                                    <ChevronDown 
                                        size={14} 
                                        className={`transition-transform duration-300 ${open ? 'rotate-180 text-red-500' : 'text-slate-400'}`} 
                                        aria-hidden="true" 
                                    />
                                </div>
                            </ComboboxButton>
                        </div>

                        {/* Dropdown Menu */}
                        <Transition
                            show={open}
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                            afterLeave={() => setQuery('')}
                        >
                            <ComboboxOptions 
                                anchor="bottom start"
                                className="z-[100] mt-2 min-w-[200px] w-[var(--input-width)] origin-top-left bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 p-2 focus:outline-none"
                            >
                                {filteredOptions.length === 0 && query !== '' ? (
                                    <div className="relative cursor-default select-none px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic">
                                        No results found for "{query}"
                                    </div>
                                ) : (
                                    <>
                                        {/* Clear Option */}
                                        <ComboboxOption
                                            value={null}
                                            className={({ focus }) => `
                                                relative cursor-pointer select-none px-4 py-3 rounded-xl transition-all
                                                ${focus ? 'bg-red-50 text-red-600' : 'text-slate-400'}
                                            `}
                                        >
                                            <span className="block truncate text-[10px] font-black uppercase tracking-wider">
                                                Clear Selection
                                            </span>
                                        </ComboboxOption>

                                        {filteredOptions.map((option) => (
                                            <ComboboxOption
                                                key={option.value}
                                                value={option}
                                                className={({ focus, selected }) => `
                                                    relative cursor-pointer select-none px-4 py-3 rounded-xl transition-all flex items-center justify-between
                                                    ${focus ? 'bg-red-50 text-red-600' : selected ? 'bg-slate-50 text-red-600' : 'text-slate-600'}
                                                `}
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`block truncate text-[10px] font-black uppercase tracking-wider ${selected ? 'font-black' : 'font-bold'}`}>
                                                            {option.label}
                                                        </span>
                                                        {selected && <Check size={12} className="text-red-500" />}
                                                    </>
                                                )}
                                            </ComboboxOption>
                                        ))}
                                    </>
                                )}
                            </ComboboxOptions>
                        </Transition>
                    </div>
                )}
            </Combobox>
        </div>
    );
}
