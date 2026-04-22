import React from 'react';
import { Calendar, User, MapPin, Play, Edit2, Trash2, Users } from 'lucide-react';

export default function ClassCard({ studyClass, onEdit, onDelete, onIncrement, onManageStudents, onResetCycle }) {
    const progress = Math.min(100, Math.round((studyClass.session_progress / studyClass.total_meetings) * 100));
    
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
            <div className="p-5 flex-1 flex flex-col gap-5">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                             <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded">
                                Cycle #{studyClass.current_session_number}
                            </span>
                            {studyClass.schedule_days && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">
                                    {Array.isArray(studyClass.schedule_days) ? studyClass.schedule_days.join(', ') : studyClass.schedule_days}
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 truncate tracking-tight uppercase">
                            {studyClass.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onResetCycle(studyClass)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors group relative" title="Reset Cycle">
                            <Play className="w-4 h-4 rotate-90" />
                        </button>
                        <button onClick={() => onEdit(studyClass)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(studyClass)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Instructor</span>
                        <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-slate-300" />
                            <span className="text-xs font-bold text-slate-700 truncate">{studyClass.instructor?.name || 'Unassigned'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Students</span>
                        <button 
                            onClick={() => onManageStudents(studyClass)}
                            className="flex items-center gap-2 group/btn w-fit"
                        >
                            <Users className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs font-black text-emerald-600 group-hover/btn:underline decoration-emerald-200">
                                {studyClass.students_count || 0} Registered
                            </span>
                        </button>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center px-0.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                        <span className="text-xs font-black text-slate-900">
                            {studyClass.session_progress}<span className="text-slate-300 mx-0.5">/</span>{studyClass.total_meetings}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-red-600 transition-all duration-700"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 italic">
                        <span>{progress}% Completed</span>
                        <span>{studyClass.meetings_per_week}x / week</span>
                    </div>
                </div>
            </div>

            {/* Action Placeholder or Footer info could go here, currently empty for cleaner look as automated */}
            <div className="px-5 pb-5 mt-auto">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-widest">
                    <span>Target: {studyClass.end_session_date ? new Date(studyClass.end_session_date).toLocaleDateString('en-GB') : 'N/A'}</span>
                    <span className="text-red-500 underline">Automated Progress</span>
                </div>
            </div>
        </div>
    );
}
