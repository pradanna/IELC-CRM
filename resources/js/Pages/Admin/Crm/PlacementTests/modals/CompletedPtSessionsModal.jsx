import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Search, Filter, Trophy, Calendar, CheckCircle2, ChevronRight, User, Loader2, BookOpen } from 'lucide-react';
import axios from 'axios';

export default function CompletedPtSessionsModal({ isOpen, onClose, exams = [], onViewResult }) {
    const [sessions, setSessions] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const abortControllerRef = useRef(null);

    const fetchSessions = (page = 1) => {
        setIsLoading(true);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        axios.get(route('admin.crm.pt-sessions.completed'), {
            params: {
                page,
                search: searchName.trim(),
                exam_id: selectedExamId,
                category: selectedCategory,
            },
            signal: abortControllerRef.current.signal,
        })
        .then((res) => {
            setSessions(res.data.data || []);
            setPagination(res.data.pagination || { current_page: 1, last_page: 1, total: 0 });
        })
        .catch((err) => {
            if (!axios.isCancel(err)) {
                console.error('Error fetching completed sessions:', err);
            }
        })
        .finally(() => {
            setIsLoading(false);
        });
    };

    // Debounced search on name filter
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            fetchSessions(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchName, selectedExamId, selectedCategory, isOpen]);

    const examList = Array.isArray(exams) ? exams : (exams?.data || []);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 md:p-8">
                <Dialog.Panel className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <Dialog.Title className="text-lg font-black text-slate-900 tracking-tight">
                                    Daftar Siswa Selesai Placement Test
                                </Dialog.Title>
                                <p className="text-xs font-semibold text-slate-400">
                                    Riwayat seluruh kandidat yang telah merampungkan ujian Placement Test
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="p-5 border-b border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Search Candidate Name */}
                        <div className="sm:col-span-6 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="Cari nama siswa atau no HP..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder-slate-400 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                            />
                        </div>

                        {/* Filter by Category */}
                        <div className="sm:col-span-3">
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setSelectedExamId('');
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none cursor-pointer"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="General">General / Adult</option>
                                <option value="Kids">Kids Placement</option>
                                <option value="IELTS">IELTS Assessment</option>
                                <option value="TOEFL">TOEFL Assessment</option>
                            </select>
                        </div>

                        {/* Filter by Specific Exam */}
                        <div className="sm:col-span-3">
                            <select
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none cursor-pointer"
                            >
                                <option value="">Semua Paket Soal</option>
                                {examList
                                    .filter((exam) => selectedCategory === 'all' || exam.category === selectedCategory)
                                    .map((exam) => (
                                        <option key={exam.id} value={exam.id}>
                                            {exam.title}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-[300px]">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
                                <span className="text-xs font-semibold">Memuat riwayat sesi...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-700">Tidak ada sesi yang cocok</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Coba ubah kata kunci pencarian atau bersihkan filter jenis ujian.
                                </p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => {
                                        onClose();
                                        onViewResult(session);
                                    }}
                                    className="p-4 bg-white hover:bg-slate-50/80 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs hover:shadow-sm"
                                >
                                    {/* Left: Avatar & Candidate Info */}
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-black text-sm border border-slate-200/60 uppercase group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-100 transition-colors">
                                            {session.lead_name?.charAt(0) || 'S'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors truncate">
                                                    {session.lead_name}
                                                </h4>
                                                {session.lead?.branch?.name && (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {session.lead.branch.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                <span className="font-semibold text-slate-600">{session.pt_exam?.title}</span>
                                                <span>•</span>
                                                <span className="text-[11px]">{session.finished_at ? new Date(session.finished_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Score & Level */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="text-right">
                                            {session.final_score !== null && (
                                                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                    <Trophy size={13} /> {session.final_score}
                                                </span>
                                            )}
                                            {session.recommended_level && (
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                    Level: <span className="text-slate-700 font-black">{session.recommended_level}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-red-50 text-slate-400 group-hover:text-red-600 flex items-center justify-center transition-colors">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer with Pagination */}
                    <div className="p-4 border-t border-gray-100 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Total: <strong className="text-slate-800">{pagination.total}</strong> siswa selesai</span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={pagination.current_page <= 1}
                                onClick={() => fetchSessions(pagination.current_page - 1)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Sebelumnya
                            </button>
                            <span>Halaman {pagination.current_page} dari {pagination.last_page || 1}</span>
                            <button
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => fetchSessions(pagination.current_page + 1)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
