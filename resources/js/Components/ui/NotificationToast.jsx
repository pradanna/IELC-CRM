import React from 'react';
import { MessageSquare, X, ExternalLink } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';

export default function NotificationToast({ notifications, onRemove }) {
    const { openDrawer } = useLeadDrawer();
    
    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[9999] space-y-4 max-w-sm w-full">
            {notifications.map((n) => (
                <div 
                    key={n.id}
                    className="bg-white border-2 border-emerald-500 rounded-[2rem] shadow-2xl p-6 flex gap-4"
                    style={{ minWidth: '300px' }}
                >
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                        <MessageSquare size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                                WA: {n.lead?.name || 'Unknown'}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mb-3">
                            {n.message}
                        </p>
                        <div className="flex items-center justify-between">
                             <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    onRemove(n.id);
                                    openDrawer(n.lead?.id, 2);
                                }}
                                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                                Reply <ExternalLink size={12} />
                            </button>
                            <button 
                                onClick={() => onRemove(n.id)}
                                className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
