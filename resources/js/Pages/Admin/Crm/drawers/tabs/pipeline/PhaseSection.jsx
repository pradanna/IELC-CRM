import React from 'react';
import { 
    Zap, 
    History, 
    MessageSquare, 
    Loader2, 
    Check, 
    ArrowRight 
} from 'lucide-react';

const normalizeCollection = (collection) => {
    if (Array.isArray(collection)) return collection;
    if (collection && Array.isArray(collection.data)) return collection.data;
    return [];
};

const cleanTemplateTitle = (title) => {
    if (!title) return '';
    return title.replace(/^\[[^\]]+\]\s*/i, '');
};

const PIPELINE_TRANSITIONS = {
    'lead': {
        nextCode: 'prospect',
        buttonLabel: 'Lanjutkan ke Prospek',
        description: 'Tandai calon siswa sebagai prospek potensial setelah kontak awal berhasil dilakukan.'
    },
    'prospect': {
        nextCode: 'consultation',
        buttonLabel: 'Jadwalkan Konsultasi',
        description: 'Prospek menunjukkan ketertarikan. Lanjutkan ke tahap Konsultasi Akademik untuk diskusi lebih mendalam.'
    },
    'consultation': {
        nextCode: 'placement-test',
        buttonLabel: 'Daftarkan Placement Test',
        description: 'Konsultasi selesai. Lanjutkan untuk menjadwalkan tes penempatan guna mengukur level kemampuan siswa.'
    },
    'placement-test': {
        nextCode: 'pre-enrollment',
        buttonLabel: 'Lanjutkan ke Pre-Enrollment',
        description: 'Hasil tes penempatan telah diperoleh. Lanjutkan ke tahap pengisian data dan plotting kelas.'
    },
    'pre-enrollment': {
        nextCode: 'invoice',
        buttonLabel: 'Terbitkan Invoice',
        description: 'Plotting kelas dan jadwal siswa selesai. Lanjutkan untuk membuat dan mengirimkan invoice tagihan.'
    },
    'invoice': {
        nextCode: 'enrollment',
        buttonLabel: 'Selesaikan Proses Enrollment',
        description: 'Pembayaran tagihan telah diterima. Daftarkan siswa secara resmi untuk memulai kelas perdana.'
    }
};

export default function PhaseSection({ 
    icon: Icon, 
    title, 
    subtitle, 
    codes, 
    children, 
    isStageActive,
    getSectionStyle,
    chatTemplates,
    lead,
    phases,
    handleSendTemplate,
    sendingTemplateId,
    onUpdatePhase
}) {
    const active = isStageActive(codes);
    
    let nextPhaseInfo = null;
    if (active) {
        const currentCode = codes.find(c => PIPELINE_TRANSITIONS[c]);
        const transition = PIPELINE_TRANSITIONS[currentCode];
        if (transition) {
            const nextPhaseObj = phases.find(p => p.code === transition.nextCode);
            if (nextPhaseObj) {
                nextPhaseInfo = {
                    id: nextPhaseObj.id,
                    name: nextPhaseObj.name,
                    buttonLabel: transition.buttonLabel,
                    description: transition.description
                };
            }
        }
    }
    
    const phaseTemplates = chatTemplates.filter(t => {
        // 1. Phase Logic: Match specific phase codes or show global templates in active section only
        const matchesPhase = t.lead_phases?.some(lp => codes.includes(lp.code));
        const isPhaseGlobal = !t.lead_phases?.length;
        const phasePass = matchesPhase || (isPhaseGlobal && active);
        
        if (!phasePass) return false;

        // 2. Type Logic: Filter by Lead Type if it's set
        const leadTypeId = lead?.lead_type_id || lead?.lead_type?.id;
        
        // If lead type is not yet selected, show all templates that passed the phase filter
        if (!leadTypeId) return true;

        const matchesType = t.lead_types?.some(lt => lt.id === leadTypeId);
        const isTypeGlobal = !t.lead_types?.length;

        // Show if template matches lead type or if template is type-global
        return matchesType || isTypeGlobal;
    });

    const phaseLogs = (lead?.chat_logs || []).filter(log => {
        const logPhase = normalizeCollection(phases).find(p => p.id === log.lead_phase_id);
        return codes.includes(logPhase?.code);
    });

    return (
        <div id={active ? "current-stage-section" : undefined} className={`relative p-8 rounded-[2.5rem] border ${getSectionStyle(codes)} transition-all duration-500`}>
            {active && (
                <div className="absolute -top-3 right-8 px-5 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-red-500/40 animate-pulse transition-transform hover:scale-105">
                    Current Stage
                </div>
            )}
            
            <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${active ? 'bg-red-50 text-red-600' : 'bg-white text-slate-400'}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h4 className={`text-md font-black tracking-tight leading-none ${active ? 'text-slate-900' : 'text-slate-500'}`}>
                        {title}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className={active ? '' : 'pointer-events-none'}>
                {children}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                {active && phaseTemplates.length > 0 && (
                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={10} className="text-amber-500" /> Suggested Messages
                        </h5>
                        <div className="flex flex-wrap gap-2">
                            {phaseTemplates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSendTemplate(t)}
                                    disabled={sendingTemplateId !== null}
                                    className={`px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition-all shadow-sm active:scale-95 flex items-center gap-2.5 ${
                                        sendingTemplateId === t.id ? 'border-amber-500 text-amber-600' : 'hover:border-red-500 hover:text-red-600'
                                    } ${sendingTemplateId !== null && sendingTemplateId !== t.id ? 'opacity-50' : ''} cursor-pointer`}
                                >
                                    {sendingTemplateId === t.id && <Loader2 size={12} className="animate-spin" />}
                                    {sendingTemplateId === t.id ? 'Sending...' : cleanTemplateTitle(t.title)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {phaseLogs.length > 0 && (
                    <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History size={10} className="text-slate-500" /> Phase History
                        </h5>
                        <div className="space-y-3">
                            {phaseLogs.map(log => (
                                <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl relative group transition-all hover:border-red-100 hover:shadow-md hover:shadow-red-500/5 cursor-default">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-red-500 group-hover:bg-red-50 transition-colors">
                                                <MessageSquare size={12} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{cleanTemplateTitle(log.template_title)}</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400">{log.formatted_date}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all pr-4">
                                        {log.message}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[8px] font-black">
                                                {log.sender_name?.charAt(0)}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Sent by {log.sender_name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-600 uppercase">Delivered</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {active && nextPhaseInfo && (() => {
                const isCurrentStageInvoice = codes.includes('invoice');
                const hasPaidInvoice = lead?.invoices?.some(inv => inv.status === 'paid');
                const isNextDisabled = isCurrentStageInvoice && !hasPaidInvoice;
                
                return (
                    <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 -mx-8 -mb-8 p-6 rounded-b-[2.5rem]">
                        <div>
                            <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tahap Selanjutnya: {nextPhaseInfo.name}</h6>
                            <p className="text-[11px] text-slate-500 leading-normal font-medium max-w-lg">
                                {nextPhaseInfo.description}
                            </p>
                            {isNextDisabled && (
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mt-1.5 animate-pulse">
                                    * Invoice belum lunas. Catat pembayaran di menu Invoice terlebih dahulu.
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (!isNextDisabled) {
                                    onUpdatePhase(nextPhaseInfo.id);
                                }
                            }}
                            disabled={isNextDisabled}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                isNextDisabled 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' 
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-95 cursor-pointer'
                            }`}
                        >
                            {nextPhaseInfo.buttonLabel}
                            <ArrowRight size={12} />
                        </button>
                    </div>
                );
            })()}
        </div>
    );
}
