import React from 'react';
import Dropdown from '@/Components/ui/Dropdown';
import { MoreVertical } from 'lucide-react';

export default function TableActionDropdown({ align = 'right', children }) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors active:scale-95">
                    <MoreVertical size={16} />
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content 
                align={align} 
                width="48" 
                contentClasses="py-1 bg-white rounded-xl shadow-xl ring-1 ring-black/5 divide-y divide-slate-50"
            >
                {children}
            </Dropdown.Content>
        </Dropdown>
    );
}

TableActionDropdown.Item = ({ onClick, children, icon: Icon, variant = 'default' }) => {
    const colorClasses = variant === 'danger' 
        ? 'text-rose-600 hover:bg-rose-50/50' 
        : 'text-slate-700 hover:bg-slate-50';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center w-full px-4 py-2.5 text-xs font-bold transition-colors gap-2 text-left ${colorClasses}`}
        >
            {Icon && <Icon size={14} className={variant === 'danger' ? 'text-rose-500' : 'text-slate-400'} />}
            {children}
        </button>
    );
};
