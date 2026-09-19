import React from 'react';
import { Calendar, User, MapPin, RotateCw, Edit2, Users, Power, Eye } from 'lucide-react';

export default function ClassCard({ studyClass, onEdit, onDelete, onIncrement, onManageStudents, onResetCycle, onToggleStatus, onViewDetail }) {
    const progress = Math.min(100, Math.round((studyClass.session_progress / (studyClass.total_meetings || 1)) * 100));
    const isActive = (studyClass.status || 'active') === 'active';
    const cardBgStyle = !isActive 
        ? 'border-slate-200 bg-slate-50/50 opacity-75' 
        : studyClass.is_private
            ? 'border-orange-200/90 bg-gradient-to-br from-orange-50/30 via-white to-orange-50/10 shadow-orange-900/5 hover:border-orange-300'
            : 'border-slate-200 bg-white hover:border-slate-300';
    
    return (
        <div className={`rounded-2xl border ${cardBgStyle} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group/card`}>
            <div className="p-5 flex-1 flex flex-col gap-5">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                             <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded">
                                Cycle #{studyClass.current_session_number}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded border ${
                                isActive 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                                {isActive ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded border ${
                                studyClass.is_private
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                                {studyClass.is_private ? 'Private' : 'Group'}
                            </span>
                            {studyClass.is_expired && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest rounded">
                                    Habis Sesi / Expired
                                </span>
                            )}
                            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded ${
                                studyClass.type === 'online' 
                                    ? 'bg-sky-50 text-sky-600 border border-sky-200' 
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}>
                                {studyClass.type || 'offline'}
                            </span>
                            {studyClass.schedule_days && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">
                                    {Array.isArray(studyClass.schedule_days) ? studyClass.schedule_days.join(', ') : studyClass.schedule_days}
                                </span>
                            )}
                        </div>
                        <h3 
                            onClick={() => onViewDetail && onViewDetail(studyClass)}
                            className="text-lg font-black text-slate-900 truncate tracking-tight uppercase cursor-pointer hover:text-red-600 transition-colors"
                            title="Klik untuk melihat detail kelas"
                        >
                            {studyClass.name}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button 
                            onClick={() => onViewDetail && onViewDetail(studyClass)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Lihat Detail Kelas"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => onToggleStatus && onToggleStatus(studyClass)} 
                            className={`p-1.5 rounded-lg transition-colors group relative ${
                                isActive 
                                    ? 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' 
                                    : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                            }`} 
                            title={isActive ? "Nonaktifkan Kelas" : "Aktifkan Kelas"}
                        >
                            <Power className="w-4 h-4" />
                        </button>
                        <button onClick={() => onResetCycle(studyClass)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors group relative" title="Mulai Sesi / Siklus Baru">
                            <RotateCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEdit(studyClass)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Class">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Students</span>
                        <div className="flex items-center gap-1.5 w-fit">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-xs font-black text-slate-900">
                                {studyClass.students_count || (studyClass.students ? studyClass.students.length : 0)} Siswa
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Detail Kelas</span>
                        <button 
                            onClick={() => onViewDetail && onViewDetail(studyClass)}
                            className="text-xs font-black text-slate-700 hover:text-red-600 flex items-center justify-end gap-1 group/qv transition-colors"
                        >
                            <span>Lihat Detail</span>
                            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover/qv:text-red-600" />
                        </button>
                    </div>
                </div>

                {/* Progress */}
                <div className="space-y-3 pt-1">
                    {studyClass.is_private ? (
                        <>
                            <div className="flex justify-between items-center px-0.5">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Progress Kedatangan
                                </span>
                                <span className="text-xs font-black text-slate-900">
                                    {studyClass.session_progress}<span className="text-slate-300 mx-0.5">/</span>{studyClass.total_meetings}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-amber-50 rounded-full overflow-hidden border border-amber-100/50">
                                <div 
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700 rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 italic">
                                <span>{progress}% Sesi Terpakai</span>
                                <span className="text-amber-600 font-bold">By Kehadiran / Kedatangan</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center px-0.5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress Periode</span>
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
                        </>
                    )}
                </div>
            </div>

            {/* Action Placeholder or Footer info */}
            <div className="px-5 pb-5 mt-auto">
                <div className={`border rounded-xl p-3 flex justify-between items-center text-[9px] font-black uppercase tracking-widest ${
                    studyClass.is_private
                        ? 'bg-amber-50/40 border-amber-100 text-amber-800/70'
                        : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                    <span>
                        {studyClass.is_private 
                            ? `Total Kuota: ${studyClass.total_meetings || 0} Sesi` 
                            : `Target: ${studyClass.end_session_date ? new Date(studyClass.end_session_date).toLocaleDateString('en-GB') : 'N/A'}`
                        }
                    </span>
                    <span className={studyClass.is_private ? 'text-amber-600 font-bold' : 'text-red-500 underline'}>
                        {studyClass.is_private ? 'Tracking Kedatangan' : 'Automated Progress'}
                    </span>
                </div>
            </div>
        </div>
    );
}
