import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Pilih...",
    icon: Icon,
    className = "",
    disabled = false,
    searchPlaceholder = "Cari...",
    error = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const selectRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                selectRef.current &&
                !selectRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
        } else {
            setSearchQuery("");
        }
    }, [isOpen]);

    const handleSelect = (optionValue) => {
        if (typeof onChange === "function") {
            onChange(optionValue);
        }
        setIsOpen(false);
        setSearchQuery("");
    };

    // --- Data Handling ---
    const isObjectOptions =
        options.length > 0 &&
        typeof options[0] === "object" &&
        options[0] !== null;

    // Find the label for the currently selected value
    const selectedLabel = (() => {
        if (value === null || value === undefined || value === "") return null;
        const selectedOption = options.find((opt) =>
            isObjectOptions
                ? String(opt.value).toLowerCase() === String(value).toLowerCase()
                : String(opt).toLowerCase() === String(value).toLowerCase()
        );
        if (!selectedOption) return value; // Fallback to raw value if not found
        return isObjectOptions ? selectedOption.label : selectedOption;
    })();

    // Filter options based on search query
    const filteredOptions = options.filter((option) => {
        if (!searchQuery.trim()) return true;
        const text = isObjectOptions ? option.label : String(option);
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div ref={selectRef} className={`relative w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            {/* --- Trigger Button --- */}
            <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) setIsOpen(!isOpen);
                }}
                className={`relative flex items-center justify-between w-full px-4 py-3.5 text-left bg-white border rounded-2xl cursor-pointer transition-all duration-200 outline-none ${
                    disabled
                        ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                        : error
                        ? "border-red-500 ring-2 ring-red-500/10"
                        : isOpen
                        ? "border-red-500 ring-4 ring-red-500/10 shadow-sm"
                        : "border-slate-300 hover:border-slate-400 shadow-xs"
                }`}
            >
                <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                    {Icon && (
                        <Icon
                            size={18}
                            className={`shrink-0 ${
                                disabled
                                    ? "text-slate-300"
                                    : isOpen
                                    ? "text-red-500"
                                    : "text-slate-400"
                            }`}
                        />
                    )}
                    <span className="truncate text-sm font-bold">
                        {selectedLabel ? (
                            <span className="text-slate-900">{selectedLabel}</span>
                        ) : (
                            <span className="text-slate-400 font-medium">{placeholder}</span>
                        )}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-red-500" : ""
                    }`}
                />
            </button>

            {/* --- Dropdown Panel (Select2 Style with Search Box) --- */}
            {isOpen && !disabled && (
                <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[220px] bg-white shadow-xl border border-slate-200/90 rounded-2xl z-[20000] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative flex items-center">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-3 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 placeholder:text-slate-400 transition-all"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        setIsOpen(false);
                                    } else if (
                                        e.key === "Enter" &&
                                        filteredOptions.length > 0
                                    ) {
                                        const firstOpt = filteredOptions[0];
                                        handleSelect(
                                            isObjectOptions ? firstOpt.value : firstOpt
                                        );
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <ul className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const optionValue = isObjectOptions
                                    ? option.value
                                    : option;
                                const optionLabel = isObjectOptions
                                    ? option.label
                                    : option;
                                const isSelected =
                                    String(value).toLowerCase() ===
                                    String(optionValue).toLowerCase();

                                return (
                                    <li
                                        key={isObjectOptions ? option.value : index}
                                        onClick={() => handleSelect(optionValue)}
                                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                                            isSelected
                                                ? "bg-red-50 text-red-600 font-black"
                                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                        }`}
                                    >
                                        <span className="truncate">{optionLabel}</span>
                                        {isSelected && (
                                            <Check size={14} className="text-red-600 shrink-0 ml-2" />
                                        )}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-4 py-3 text-xs text-slate-400 text-center font-medium italic">
                                {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Tidak ada opsi"}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Select;
