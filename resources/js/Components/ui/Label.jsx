import React from "react";

export default function Label({ value, className = "", children, ...props }) {
    return (
        <label
            {...props}
            className={`block text-sm font-medium leading-6 text-gray-900 ${className}`}
        >
            {value ? value : children}
        </label>
    );
}
