import React from 'react';
import { StickyNote, Loader2, Save, Calendar, Zap } from 'lucide-react';
import DatePicker from '@/Components/form/DatePicker';

export default function ConsultationStage({
    lead,
    isStageActive,
    consultationForm,
    setConsultationForm,
    handleSaveConsultation,
    savingConsultation
}) {
    return (
        <div className="space-y-6">
            {/* Quick Record Form */}
            {isStageActive(['consultation']) && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] shadow-inner space-y-5">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <StickyNote size={10} className="text-red-500" /> Tambahkan Catatan Konsultasi
                    </h5>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Konsultasi</label>
                            <DatePicker 
                                value={consultationForm.consultation_date}
                                onChange={val => setConsultationForm({...consultationForm, consultation_date: val})}
                                inputClassName="!py-2 !h-auto !bg-white !border-slate-200 !rounded-xl !text-xs !font-bold !text-slate-700 !shadow-none !ring-red-500/20"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveConsultation}
                        disabled={savingConsultation}
                        className="w-full py-3 bg-slate-900 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {savingConsultation ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Simpan Catatan Konsultasi
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {lead?.consultations?.length > 0 ? (
                    lead.consultations.map((c) => (
                        <div key={c.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm relative overflow-hidden group hover:border-red-100 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                        <Calendar size={14} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800 tracking-tight">{c.formatted_date}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">By {c.consultant_name}</p>
                                    </div>
                                </div>
                                {c.recommended_level && (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                        {c.recommended_level}
                                    </span>
                                )}
                            </div>
                            {c.notes && (
                                <div className="pl-11 space-y-3">
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.notes}</p>
                                    {c.follow_up_note && (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                                            <Zap size={10} className="text-amber-500 mt-0.5" />
                                            <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">Next: {c.follow_up_note}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="p-10 bg-slate-50 rounded-3xl border border-slate-100 border-dashed text-center">
                        <StickyNote size={24} className="mx-auto text-slate-200 mb-3" />
                        <p className="italic text-slate-400 text-[10px] font-bold uppercase tracking-widest">Belum ada catatan konsultasi recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
