import React from 'react';
import { Trophy, GraduationCap, CreditCard } from 'lucide-react';

export default function EnrollmentStage({ lead, setIsInvoiceModalOpen }) {
    return (
        <>
            {lead?.enrolled_at ? (
                <div className="space-y-6">
                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50/50">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-emerald-900 tracking-tight leading-none mb-2">Student Enrolled</h4>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                Officially closed on {lead.formatted_enrolled_at}
                            </p>
                        </div>
                    </div>
                    
                    {lead?.student?.study_classes?.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                            {lead.student.study_classes.map((cls, i) => (
                                <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap size={18} className="text-slate-400" />
                                        <span className="text-sm font-black text-slate-800">{cls.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Class</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                        <button 
                            onClick={() => setIsInvoiceModalOpen(true)}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
                        >
                            <CreditCard size={16} />
                            Issue Next Invoice (Rejoin)
                        </button>
                        <p className="text-[9px] font-bold text-slate-400 mt-3 text-center uppercase tracking-widest italic">
                            Gunakan ini untuk perpanjangan level atau periode berikutnya
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 px-6 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Waiting for final conversion</p>
                </div>
            )}
        </>
    );
}
