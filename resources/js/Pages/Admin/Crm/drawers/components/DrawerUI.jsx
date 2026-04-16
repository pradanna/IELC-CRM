import React from 'react';
import { History } from 'lucide-react';

export function SectionHeader({ icon: Icon, title }) {
    return (
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-50">
            <Icon size={14} className="text-red-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{title}</h3>
        </div>
    );
}

export function InfoItem({ label, value, icon: Icon }) {
    return (
        <div className="flex flex-col gap-2.5 p-4 rounded-2xl transition-all hover:bg-slate-50/80 group">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">{label}</p>
            <div className="flex items-center gap-3">
                {Icon && <Icon size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />}
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight break-words">{value || '---'}</p>
            </div>
        </div>
    );
}

export function EmptyState({ icon: Icon = History, title, desc }) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center opacity-60">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6">
                <Icon size={40} />
            </div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">{title}</h4>
            <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto mt-2">{desc}</p>
        </div>
    );
}
