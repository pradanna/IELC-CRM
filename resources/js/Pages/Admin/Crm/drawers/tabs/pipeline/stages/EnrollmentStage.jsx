import React from 'react';
import { GraduationCap, Calendar, FileText } from 'lucide-react';

export default function EnrollmentStage({ lead }) {
    const enrollments = lead?.enrollments || [];

    return (
        <div className="space-y-4">
            {enrollments.length > 0 ? (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <GraduationCap size={14} className="text-emerald-500" /> Enrolled Classes
                        </h5>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                            {enrollments.length} {enrollments.length === 1 ? 'Kelas' : 'Kelas'}
                        </span>
                    </div>
                    {enrollments.map(enrollment => (
                        <div key={enrollment.id} className="flex items-center justify-between p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                                    <GraduationCap size={16} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 tracking-tight">
                                        {enrollment.study_class?.name || 'Unknown Class'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-0.5">
                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} /> Joined: {enrollment.formatted_joined_at}
                                        </span>
                                        {enrollment.formatted_end_date && (
                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar size={10} /> Selesai: {enrollment.formatted_end_date}
                                            </span>
                                        )}
                                        {enrollment.invoice_number && (
                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                <FileText size={10} /> {enrollment.invoice_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                enrollment.status === 'completed'
                                    ? 'bg-sky-50 text-sky-600 border-sky-100'
                                    : enrollment.status === 'stopped'
                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                                {enrollment.status || 'Active'}
                            </span>
                        </div>
                    ))}
                </>
            ) : lead?.enrolled_at ? (
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center">
                    <GraduationCap size={24} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-black text-emerald-700">Enrolled</p>
                    <p className="text-[10px] font-bold text-emerald-500 mt-1">
                        Officially closed on {lead.formatted_enrolled_at}
                    </p>
                </div>
            ) : (
                <div className="p-6 bg-slate-50 border border-slate-100 border-dashed rounded-2xl text-[10px] text-slate-400 text-center font-bold">
                    Belum ada enrollment tercatat.
                </div>
            )}
        </div>
    );
}
