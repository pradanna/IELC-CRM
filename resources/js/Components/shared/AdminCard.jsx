import React from 'react';

/**
 * AdminCard
 * A standardized panel/card component for admin interfaces.
 * 
 * @param {React.ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 * @param {string} padding - Padding class (default: p-8)
 * @param {React.ReactNode} header - Optional header content
 * @param {React.ReactNode} footer - Optional footer content
 */
export default function AdminCard({ 
    children, 
    className = "", 
    padding = "p-8",
    header = null,
    footer = null
}) {
    return (
        <div className={`bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col ${className}`}>
            {header && (
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30">
                    {header}
                </div>
            )}
            
            <div className={`${padding} flex-1`}>
                {children}
            </div>

            {footer && (
                <div className="px-8 py-5 border-t border-slate-50 bg-slate-50/30">
                    {footer}
                </div>
            )}
        </div>
    );
}
