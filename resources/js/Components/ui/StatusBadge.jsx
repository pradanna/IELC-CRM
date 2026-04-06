import React from "react";

const StatusBadge = ({ children, color, backgroundColor, className = "" }) => {
    return (
        <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border border-black/5 ${className}`}
            style={{
                color: color || "#374151", // Fallback text-gray-700
                backgroundColor: backgroundColor || "#f3f4f6", // Fallback bg-gray-100
            }}
        >
            {children}
        </span>
    );
};

export default StatusBadge;
