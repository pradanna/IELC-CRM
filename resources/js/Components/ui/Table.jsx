import React from 'react';

export const Table = ({ children, className = "", noPanel = false }) => (
    <div className={noPanel ? `w-full ${className}` : `bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                {children}
            </table>
        </div>
    </div>
);

export const THead = ({ children, className = "" }) => (
    <thead className={`border-b border-slate-100 bg-slate-50/50 ${className}`}>
        {children}
    </thead>
);

export const TBody = ({ children, className = "" }) => (
    <tbody className={`divide-y divide-slate-50 ${className}`}>
        {children}
    </tbody>
);

export const TR = ({ children, className = "", hover = true, ...props }) => (
    <tr 
        className={`${hover ? 'group hover:bg-slate-50/50 transition-all' : ''} ${className}`}
        {...props}
    >
        {children}
    </tr>
);

export const TH = ({ children, className = "" }) => (
    <th className={`px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest ${className}`}>
        {children}
    </th>
);

export const TD = ({ children, className = "" }) => (
    <td className={`px-8 py-6 ${className}`}>
        {children}
    </td>
);
