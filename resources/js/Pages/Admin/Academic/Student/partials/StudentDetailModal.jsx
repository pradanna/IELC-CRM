import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, User, Phone, Mail, MapPin, Calendar, BookOpen, Award, FileText } from 'lucide-react';
import Button from '@/Components/ui/Button';

export default function StudentDetailModal({ show, onClose, student }) {
    if (!student) return null;

    return (
        <Transition show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-55 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl border border-slate-100">
                                {/* Header */}
                                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                                    <div className="space-y-1">
                                        <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                            Detail Siswa
                                        </Dialog.Title>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {student.student_number} • Status: {student.status}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                    {/* Profile Summary */}
                                    <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{student.lead?.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.student_number}</p>
                                        </div>
                                    </div>

                                    {/* Personal Info */}
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <User size={12} /> Informasi Kontak & Cabang
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <Phone size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold">{student.lead?.phone || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold truncate">{student.lead?.email || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <MapPin size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold">{student.lead?.branch?.name || 'Central'}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold">
                                                    Mulai Join: {student.start_join ? new Date(student.start_join).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (student.enrolled_at || '-')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Info */}
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <BookOpen size={12} /> Kelas yang Diikuti
                                        </h5>
                                        <div className="space-y-2">
                                            {student.study_classes && student.study_classes.length > 0 ? (
                                                student.study_classes.map(cls => (
                                                    <div key={cls.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                        <div>
                                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{cls.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                Siklus #{cls.current_session_number} • Selesai: {cls.end_session_date || '-'}
                                                            </p>
                                                        </div>
                                                        <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-100">
                                                            Aktif
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-slate-400 italic font-semibold">Siswa belum terdaftar di kelas manapun.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Loyalty / History Info */}
                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Award size={12} /> Loyalitas & Voucher
                                        </h5>
                                        <div className="grid grid-cols-2 gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Loyalitas</p>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight mt-0.5">
                                                    {student.loyalty_tier || 'Bronze'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Paket Selesai</p>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight mt-0.5">
                                                    {student.rejoin_count || 0} Paket
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Remarks / Notes */}
                                    {student.notes && (
                                        <div className="space-y-3">
                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <FileText size={12} /> Catatan / Keterangan
                                            </h5>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 leading-relaxed font-semibold">
                                                {student.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={onClose}
                                        variant="primary"
                                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl"
                                    >
                                        Tutup
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
