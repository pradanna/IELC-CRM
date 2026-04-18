import React from 'react';
import { Calendar, User, Clock, ChevronRight } from 'lucide-react';

const ExpiringStudentsList = ({ students = [], onView }) => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl">
                        <Clock size={16} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Expiring Study Periods</h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">Masa belajar akan habis dalam ≤ 14 hari</p>
                    </div>
                </div>
                <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {students.length} Siswa
                </div>
            </div>

            <div className="divide-y divide-gray-50 overflow-y-auto max-h-[400px] flex-1">
                {students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center h-full">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <Clock size={32} className="text-gray-200" />
                        </div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Semua Aman</h4>
                        <p className="text-[10px] font-medium text-gray-300 leading-relaxed max-w-[200px]">
                            Belum ada siswa dengan masa belajar yang akan habis dalam waktu dekat.
                        </p>
                    </div>
                ) : (
                    students.map((student) => (
                        <div 
                            key={student.id} 
                            className="p-5 hover:bg-slate-50 transition-all cursor-pointer group"
                            onClick={() => onView(student.lead_id, 0)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors uppercase tracking-tight line-clamp-1">
                                            {student.name}
                                        </h4>
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-widest">
                                            {student.branch}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Calendar size={12} />
                                            <span className="text-[11px] font-bold">{student.expiry_date}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <User size={12} />
                                            <span className="text-[11px] font-bold">{student.class_name}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2">
                                    <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                                        student.days_left <= 3 ? 'bg-red-100 text-red-600' : 
                                        student.days_left <= 7 ? 'bg-amber-100 text-amber-600' : 
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {student.days_left} Hari Lagi
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-red-500 transition-all translate-x-0 group-hover:translate-x-1" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-50 mt-auto">
                <p className="text-[10px] text-gray-400 font-bold text-center leading-relaxed italic">
                    Segera hubungi siswa untuk penawaran program baru atau lanjut level.
                </p>
            </div>
        </div>
    );
};

export default ExpiringStudentsList;
