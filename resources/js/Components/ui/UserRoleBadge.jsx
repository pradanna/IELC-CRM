import React from 'react';
import { Shield } from 'lucide-react';

const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
        case 'superadmin': return 'bg-red-50 text-red-600 border-red-100';
        case 'marketing': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'teacher': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'frontdesk': return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'finance': return 'bg-amber-50 text-amber-600 border-amber-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
};

export default function UserRoleBadge({ role }) {
    if (!role) return null;

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${getRoleColor(role)}`}>
            <Shield size={12} />
            {role}
        </div>
    );
}
