import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const Select = ({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Select an option",
    icon: Icon,
    className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                selectRef.current &&
                !selectRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue) => {
        if (typeof onChange === "function") {
            onChange(optionValue);
        }
        setIsOpen(false);
    };

    // --- Data Handling ---
    // Check if options are objects or strings
    const isObjectOptions =
        options.length > 0 &&
        typeof options[0] === "object" &&
        options[0] !== null;

    // Find the label for the currently selected value
    const selectedLabel = (() => {
        if (value === null || value === undefined) return null;
        const selectedOption = options.find((opt) =>
            isObjectOptions ? opt.value === value : opt === value,
        );
        if (!selectedOption) return null;
        return isObjectOptions ? selectedOption.label : selectedOption;
    })();

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
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`relative flex items-center w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
            >
                {Icon && (
                    <Icon
                        size={18}
                        className="text-gray-400 mr-2 flex-shrink-0"
                    />
                )}
                <span className="flex-1 block truncate">
                    {selectedLabel ? (
                        <span className="text-gray-900">{selectedLabel}</span>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </span>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 ml-2 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* --- Dropdown Panel --- */}
            {isOpen && (
                <div className="absolute top-full mt-1 min-w-full w-max bg-white shadow-xl border border-gray-100 rounded-lg z-[20000] overflow-hidden">
                    <ul className="max-h-60 overflow-y-auto py-1">
                        {options.map((option, index) => {
                            const optionValue = isObjectOptions
                                ? option.value
                                : option;
                            const optionLabel = isObjectOptions
                                ? option.label
                                : option;
                            const isSelected = value === optionValue;

                            return (
                                <li
                                    key={isObjectOptions ? option.value : index}
                                    onMouseDown={() =>
                                        handleSelect(optionValue)
                                    }
                                    className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                                        isSelected
                                            ? "text-primary font-medium"
                                            : "text-gray-800"
                                    }`}
                                >
                                    <span>{optionLabel}</span>
                                    {isSelected && <Check size={16} />}
                                </li>
                            );
                        })}
                        {options.length === 0 && (
                            <li className="px-3 py-2 text-sm text-gray-500 text-center">
                                No options available
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Select;
