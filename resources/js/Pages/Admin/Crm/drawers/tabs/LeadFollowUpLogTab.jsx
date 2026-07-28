import React, { useState, useRef, useEffect } from 'react';
import { PhoneCall, MessageSquare, Phone, User, Clock, CheckCircle2, Plus, Sparkles, Filter } from 'lucide-react';

export default function LeadFollowUpLogTab({ lead, onRefresh }) {
    const scrollRef = useRef(null);
    const activities = lead?.lead_activities || [];
    const fupCount = lead?.follow_up_count || 0;

    const [typeFilter, setTypeFilter] = useState('all');

    // Auto-scroll on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [activities.length]);

    const openRecordModal = (defaultType = 'phone') => {
        document.dispatchEvent(new CustomEvent('openRecordFollowUpModal', { 
            detail: { lead, defaultType } 
        }));
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'whatsapp':
                return {
                    label: 'WhatsApp',
                    icon: MessageSquare,
                    badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                    dotBg: 'bg-emerald-500'
                };
            case 'phone':
                return {
                    label: 'Panggilan Telepon',
                    icon: PhoneCall,
                    badgeBg: 'bg-blue-50 text-blue-600 border-blue-200',
                    dotBg: 'bg-blue-500'
                };
            case 'sms':
                return {
                    label: 'SMS',
                    icon: Phone,
                    badgeBg: 'bg-purple-50 text-purple-600 border-purple-200',
                    dotBg: 'bg-purple-500'
                };
            case 'offline_chat':
                return {
                    label: 'Tatap Muka',
                    icon: CheckCircle2,
                    badgeBg: 'bg-amber-50 text-amber-600 border-amber-200',
                    dotBg: 'bg-amber-500'
                };
            default:
                return {
                    label: 'Follow-Up',
                    icon: PhoneCall,
                    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
                    dotBg: 'bg-slate-500'
                };
        }
    };

    const filteredActivities = activities.filter(act => {
        if (typeFilter === 'all') return true;
        return act.type === typeFilter;
    });

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Mini Stats */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 blur-3xl pointer-events-none" />
                
                <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/30">
                            FUP Counter
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Last: {lead?.human_last_activity_at || 'Belum ada'}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-black text-white tracking-tight">
                            {fupCount} <span className="text-sm font-bold text-slate-400">kali follow-up</span>
                        </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                        {(() => {
                            const maxFup = (lead?.lead_phase?.status === 'prospective') ? 7 : 4;
                            return fupCount >= maxFup
                                ? `Lead ini sudah mencapai batas ${maxFup}x follow-up dan dikategorikan ke Cold Leads.`
                                : `Butuh ${maxFup - fupCount}x follow-up lagi sebelum otomatis pindah ke Cold Leads.`;
                        })()}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 relative z-10">
                    <button
                        onClick={() => openRecordModal('phone')}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 active:scale-95"
                    >
                        <PhoneCall size={14} /> + Telepon
                    </button>
                    <button
                        onClick={() => openRecordModal('whatsapp')}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
                    >
                        <MessageSquare size={14} /> + WA Manual
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                    {['all', 'phone', 'whatsapp', 'sms', 'offline_chat'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                typeFilter === t 
                                    ? 'bg-slate-900 text-white shadow-sm' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            {t === 'all' ? 'Semua Log' : t === 'offline_chat' ? 'Tatap Muka' : t}
                        </button>
                    ))}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {filteredActivities.length} entri ditemukan
                </span>
            </div>

            {/* Timeline Log List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-[300px] scrollbar-thin scrollbar-thumb-slate-200">
                {filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-slate-300">
                        <PhoneCall size={48} strokeWidth={1} className="mb-4 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Belum ada log follow-up</p>
                        <p className="text-xs text-slate-400 mt-1">Gunakan tombol di atas untuk mencatat percakapan.</p>
                    </div>
                ) : (
                    filteredActivities.map((act, index) => {
                        const cfg = getTypeConfig(act.type);
                        const Icon = cfg.icon;
                        return (
                            <div 
                                key={act.id || index}
                                className="bg-white border-2 border-slate-50 rounded-3xl p-6 transition-all hover:border-slate-200 hover:shadow-lg shadow-sm group relative"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-2xl border ${cfg.badgeBg} flex items-center gap-2`}>
                                            <Icon size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{cfg.label}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                        <Clock size={12} />
                                        <span>{act.formatted_at} ({act.human_at})</span>
                                    </div>
                                </div>

                                <div className="text-sm font-bold text-slate-800 leading-relaxed pl-1 whitespace-pre-wrap">
                                    {act.description}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400">
                                    <span>Dicatat oleh: <strong className="text-slate-700">{act.user?.name || 'System'}</strong></span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
