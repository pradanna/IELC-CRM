import React, { useState, useMemo } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Transition } from '@headlessui/react';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * Premium Searchable Multi Select
 */
export default function PremiumSearchableMultiSelect({ 
    options = [], 
    value = [], // expects array of values
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

    // Value should be array of option objects that headless ui can compare
    const selectedOptions = useMemo(() => {
        if (!Array.isArray(value)) return [];
        return options.filter(opt => value.includes(opt.value));
    }, [value, options]);

    const handleRemove = (e, valToRemove) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(value.filter(v => v !== valToRemove));
    };

    return (
        <div className={`relative ${className}`}>
            <Combobox 
                value={selectedOptions} 
                onChange={(vals) => {
                    onChange(vals.map(v => v.value));
                    setQuery('');
                }}
                onClose={() => setQuery('')}
                multiple
            >
                {({ open }) => (
                    <div className="relative">
                        <div className={`
                            relative flex flex-wrap items-center w-full min-h-[46px] bg-white border ${open ? 'border-red-500 shadow-sm ring-4 ring-red-500/5' : 'border-slate-300 hover:border-slate-400'} 
                            rounded-2xl transition-all duration-300 outline-none shadow-sm pb-1 pl-3 pr-10 pt-1 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/5
                        `}>
                            {/* Selected Tags */}
                            {selectedOptions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mr-2 my-1">
                                    {selectedOptions.map(opt => (
                                        <span key={opt.value} className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">
                                            {opt.label}
                                            <button 
                                                type="button" 
                                                onClick={(e) => handleRemove(e, opt.value)}
                                                className="hover:text-red-900 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex-1 min-w-[100px] flex items-center">
                                {Icon && selectedOptions.length === 0 && <Icon size={16} className={`mr-2 ${open ? 'text-red-500' : 'text-slate-400'} transition-colors`} />}
                                <ComboboxInput
                                    className="w-full bg-transparent border-none p-0 py-1.5 text-[11px] font-black text-slate-700 uppercase tracking-wider focus:ring-0 outline-none placeholder:text-slate-400 placeholder:normal-case font-black uppercase tracking-wider"
                                    placeholder={selectedOptions.length === 0 ? placeholder : ''}
                                    displayValue={() => ''}
                                    onChange={(event) => setQuery(event.target.value)}
                                />
                            </div>

                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-4">
                                <ChevronDown 
                                    size={14} 
                                    className={`transition-transform duration-300 ${open ? 'rotate-180 text-red-500' : 'text-slate-400'}`} 
                                    aria-hidden="true" 
                                />
                            </ComboboxButton>
                        </div>

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
                                className="z-[100] mt-2 min-w-[200px] w-[var(--input-width)] origin-top-left bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 p-2 focus:outline-none max-h-60 overflow-y-auto"
                            >
                                {filteredOptions.length === 0 ? (
                                    <div className="relative cursor-default select-none px-4 py-3 text-[10px] font-black text-slate-400 uppercase italic">
                                        No results found for "{query}"
                                    </div>
                                ) : (
                                    <>
                                        {filteredOptions.map((option) => {
                                            const isSelected = value.includes(option.value);
                                            return (
                                                <ComboboxOption
                                                    key={option.value}
                                                    value={option}
                                                    className={({ focus }) => `
                                                        relative cursor-pointer select-none px-4 py-3 rounded-xl transition-all flex items-center justify-between
                                                        ${focus ? 'bg-red-50 text-red-600' : isSelected ? 'bg-slate-50 text-red-600' : 'text-slate-600'}
                                                    `}
                                                >
                                                    <span className={`block truncate text-[10px] uppercase tracking-wider ${isSelected ? 'font-black' : 'font-bold'}`}>
                                                        {option.label}
                                                    </span>
                                                    {isSelected && <Check size={12} className="text-red-500" />}
                                                </ComboboxOption>
                                            )
                                        })}
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
