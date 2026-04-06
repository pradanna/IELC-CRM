import React from "react";
import { Search } from "lucide-react";

export default function SearchInput({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
    ...props
}) {
    return (
        <div className={`relative w-full sm:max-w-sm ${className}`}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full rounded-lg border-0 py-2.5 pl-10 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-600"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...props}
            />
        </div>
    );
}
