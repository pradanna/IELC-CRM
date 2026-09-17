import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';
import { 
    Plus, 
    Search, 
    FileText, 
    Users, 
    Clock, 
    ArrowUpRight, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    PlayCircle, 
    CheckCircle2,
    Calendar,
    ChevronRight,
    Trophy
} from 'lucide-react';
import { Dialog } from '@headlessui/react';
import Button from '@/Components/ui/Button';

import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import AdminCard from '@/Components/shared/AdminCard';
import RichTextEditor from '@/Components/ui/RichTextEditor';
import SessionResultDetailModal from '../drawers/modals/SessionResultDetailModal';
import CompletedPtSessionsModal from './modals/CompletedPtSessionsModal';

export default function Index({ stats, sessions, exams }) {
    const [mainView, setMainView] = useState('packages'); // 'packages' | 'submissions'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);

    // Submissions tab states
    const [submissionsList, setSubmissionsList] = useState(sessions.data || []);
    const [submissionsPagination, setSubmissionsPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: sessions.data?.length || 0,
    });
    const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
    const [submissionSearch, setSubmissionSearch] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState('all');
    const [submissionCategory, setSubmissionCategory] = useState('all');
    const abortRef = useRef(null);

    const fetchSubmissions = (page = 1) => {
        setIsSubmissionsLoading(true);
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        axios.get(route('admin.crm.pt-sessions.completed'), {
            params: {
                page,
                search: submissionSearch.trim(),
                status: submissionStatus,
                category: submissionCategory,
            },
            signal: abortRef.current.signal,
        })
        .then((res) => {
            setSubmissionsList(res.data.data || []);
            setSubmissionsPagination(res.data.pagination || { current_page: 1, last_page: 1, total: 0 });
        })
        .catch((err) => {
            if (!axios.isCancel(err)) {
                console.error('Error fetching submissions:', err);
            }
        })
        .finally(() => {
            setIsSubmissionsLoading(false);
        });
    };

    useEffect(() => {
        if (mainView === 'submissions') {
            const timer = setTimeout(() => {
                fetchSubmissions(1);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [mainView, submissionSearch, submissionStatus, submissionCategory]);
    
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        if (sessionId && sessions.data) {
            const session = sessions.data.find(s => s.id === sessionId);
            if (session) {
                handleViewResult(session);
            }
        }
    }, [sessions.data]);

    const handleViewResult = (session) => {
        setSelectedSession(session);
        setIsResultModalOpen(true);
    };
    
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        category: 'General',
        duration_minutes: 60,
        description: '',
        is_active: true
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.placement-tests.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            }
        });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    const [activeTab, setActiveTab] = useState('all');
    const [searchFilter, setSearchFilter] = useState('');

    const filteredExams = (exams.data || []).filter(exam => {
        const matchesCategory = activeTab === 'all' || (exam.category || 'General').toLowerCase() === activeTab.toLowerCase();
        const matchesSearch = !searchFilter || (exam.title || '').toLowerCase().includes(searchFilter.toLowerCase()) || (exam.description || '').toLowerCase().includes(searchFilter.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'Kids':
                return { label: 'Kids', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
            case 'IELTS':
                return { label: 'IELTS', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' };
            case 'Teens':
                return { label: 'Teens', bg: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' };
            default:
                return { label: 'General', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
        }
    };

    return (
        <AdminLayout>
            <Head title="Placement Test Dashboard" />

            <AdminPageLayout
                title="Placement Test"
                subtitle="Assessment Packages & Diagnostic Monitoring"
                maxWidth="max-w-[1600px]"
                actions={
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full shadow-lg shadow-red-600/20 transition-all active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Package</span>
                    </button>
                }
            >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Assigned Today', value: stats.today, icon: Calendar, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                        { label: 'Live In Progress', value: stats.in_progress, icon: PlayCircle, color: 'text-blue-600 bg-blue-50 border-blue-100', active: true },
                        { label: 'Completed Today', value: stats.completed_today, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 relative group overflow-hidden transition-all hover:shadow-md">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 ${stat.color} border rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
                                    <stat.icon size={26} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{stat.value}</p>
                                </div>
                                {stat.active && (
                                    <div className="ml-auto">
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-200/60 animate-pulse">
                                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                            Active
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Top-Level Mode Tabs */}
                <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex gap-8">
                        <button
                            type="button"
                            onClick={() => setMainView('packages')}
                            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                                mainView === 'packages'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <FileText size={16} />
                            <span>Paket Ujian</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                mainView === 'packages' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {(exams.data || []).length}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setMainView('submissions')}
                            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                                mainView === 'submissions'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <Users size={16} />
                            <span>Aktivitas & Hasil Siswa</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                mainView === 'submissions' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {stats.in_progress > 0 ? `${stats.in_progress} live` : (submissionsPagination.total || sessions.data?.length || 0)}
                            </span>
                        </button>
                    </div>

                    {/* Quick counter or helper text */}
                    <div className="hidden md:block pb-4 text-xs font-semibold text-slate-400">
                        {mainView === 'packages' 
                            ? 'Kelola soal, modul, durasi & live preview' 
                            : 'Pantau pengerjaan siswa & input penilaian skor'}
                    </div>
                </div>

                {/* VIEW 1: EXAM PACKAGES */}
                {mainView === 'packages' && (
                    <div className="space-y-6">
                        {/* Sub-Filters: Category Tabs & Search Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                            <div className="flex flex-wrap items-center gap-2">
                                {[
                                    { id: 'all', label: 'Semua Paket', count: (exams.data || []).length },
                                    { id: 'General', label: 'General / Adult', dot: 'bg-blue-500', count: (exams.data || []).filter(e => (e.category || 'General') === 'General').length },
                                    { id: 'Kids', label: 'Kids Placement', dot: 'bg-amber-500', count: (exams.data || []).filter(e => e.category === 'Kids').length },
                                    { id: 'IELTS', label: 'IELTS Assessment', dot: 'bg-indigo-500', count: (exams.data || []).filter(e => e.category === 'IELTS').length },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                                            activeTab === tab.id
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
                                        <span>{tab.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                            activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Cari paket ujian..." 
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold w-full focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Full Width Packages Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredExams.map((exam) => {
                                const cat = getCategoryBadge(exam.category);
                                return (
                                    <div 
                                        key={exam.id} 
                                        className="bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/5 transition-all group flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Top Badge & Actions */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${cat.bg}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                                                    {cat.label}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <Link 
                                                        href={route('admin.placement-tests.show', exam.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                        title="Edit / Kelola Soal"
                                                    >
                                                        <Edit2 size={15} />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (exam.has_sessions) {
                                                                alert('Paket ujian ini tidak dapat dihapus karena sudah memiliki riwayat sesi pengerjaan oleh lead / siswa.');
                                                                return;
                                                            }
                                                            if (confirm(`Apakah Anda yakin ingin menghapus paket "${exam.title}"?`)) {
                                                                router.delete(route('admin.placement-tests.destroy', exam.id));
                                                            }
                                                        }}
                                                        className={`p-2 rounded-xl transition-colors ${
                                                            exam.has_sessions 
                                                                ? 'text-slate-200 cursor-not-allowed' 
                                                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                                        }`}
                                                        title={exam.has_sessions ? 'Tidak bisa dihapus (sudah dipakai)' : 'Hapus Paket'}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Title & Description */}
                                            <h3 className="text-base font-black text-slate-900 mb-2 group-hover:text-red-600 transition-colors tracking-tight line-clamp-1">
                                                {exam.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-5 leading-relaxed">
                                                {exam.description 
                                                    ? exam.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() 
                                                    : 'Tidak ada deskripsi paket.'}
                                            </p>
                                        </div>

                                        {/* Footer Info & Action */}
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={13} className="text-slate-400" /> {exam.duration_minutes}m
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1.5">
                                                    <FileText size={13} className="text-slate-400" /> {exam.questions_count} Soal
                                                </span>
                                            </div>

                                            <Link 
                                                href={route('admin.placement-tests.show', exam.id)}
                                                className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-700 uppercase tracking-wider bg-red-50 hover:bg-red-100/80 px-3 py-1.5 rounded-xl transition-all"
                                            >
                                                <span>Kelola Soal</span>
                                                <ArrowUpRight size={13} />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* New Package Card */}
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-red-50/40 hover:border-red-300 transition-all group cursor-pointer min-h-[220px]"
                            >
                                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                                    <Plus size={28} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-800 group-hover:text-red-600 uppercase tracking-wider">Tambah Paket Baru</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">General, Kids Canvas, atau IELTS Assessment</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* VIEW 2: CANDIDATE SUBMISSIONS & EVALUATION */}
                {mainView === 'submissions' && (
                    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 space-y-6">
                        {/* Header & Filter Controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-base font-black text-slate-900 tracking-tight">Daftar Aktivitas & Hasil Siswa</h2>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                    Pantau sesi tes live, evaluasi lembar jawaban siswa, dan konversi skor
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search Candidate */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama siswa / no HP..." 
                                        value={submissionSearch}
                                        onChange={(e) => setSubmissionSearch(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold w-full focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all outline-none"
                                    />
                                </div>

                                {/* Status Filter */}
                                <select
                                    value={submissionStatus}
                                    onChange={(e) => setSubmissionStatus(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all outline-none cursor-pointer"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="completed">Completed (Selesai)</option>
                                    <option value="in_progress">In Progress (Sedang Tes)</option>
                                    <option value="pending">Pending (Belum Mulai)</option>
                                </select>

                                {/* Category Filter */}
                                <select
                                    value={submissionCategory}
                                    onChange={(e) => setSubmissionCategory(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all outline-none cursor-pointer"
                                >
                                    <option value="all">Semua Kategori</option>
                                    <option value="General">General / Adult</option>
                                    <option value="Kids">Kids Placement</option>
                                    <option value="IELTS">IELTS Assessment</option>
                                </select>
                            </div>
                        </div>

                        {/* Submissions List */}
                        <div className="space-y-3">
                            {isSubmissionsLoading ? (
                                <div className="text-center py-16 text-slate-400">
                                    <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-xs font-bold">Memuat daftar aktivitas ujian...</p>
                                </div>
                            ) : submissionsList.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-700">Tidak ada sesi ujian ditemukan</p>
                                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian atau buat sesi baru dari Lead CRM.</p>
                                </div>
                            ) : (
                                submissionsList.map((session) => (
                                    <div 
                                        key={session.id} 
                                        onClick={() => handleViewResult(session)}
                                        className="p-4 bg-white hover:bg-slate-50/90 border border-slate-100 hover:border-slate-200 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-2xs hover:shadow-sm"
                                    >
                                        {/* Left: Avatar & Candidate Info */}
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-black text-sm border border-slate-200/60 uppercase group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-100 transition-colors">
                                                {session.lead_name?.charAt(0) || 'S'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2.5">
                                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors truncate">
                                                        {session.lead_name}
                                                    </h4>
                                                    <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider shrink-0 ${getStatusStyle(session.status)}`}>
                                                        {session.status}
                                                    </span>
                                                    {session.lead?.branch?.name && (
                                                        <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {session.lead.branch.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-medium">
                                                    <span className="font-bold text-slate-700">{session.pt_exam?.title}</span>
                                                    <span>•</span>
                                                    <span>
                                                        {session.finished_at 
                                                            ? `Selesai: ${new Date(session.finished_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                                                            : `Dibuat: ${new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Score & Actions */}
                                        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                            <div className="text-left sm:text-right">
                                                {session.status === 'completed' && session.final_score !== null ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                                                        <Trophy size={14} className="shrink-0" />
                                                        {session.percentage !== null && session.percentage !== undefined ? (
                                                            <>
                                                                <span>{session.percentage}%</span>
                                                                {session.total_questions > 0 && (
                                                                    <span className="text-emerald-700/70 font-bold text-[11px]">
                                                                        ({session.correct_answers ?? session.final_score}/{session.total_questions})
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span>{session.final_score}</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-400">
                                                        {session.status === 'in_progress' ? 'Sedang Mengerjakan' : 'Menunggu Siswa'}
                                                    </span>
                                                )}
                                                {session.recommended_level && (
                                                    <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                        Level: <span className="text-slate-800 font-black">{session.recommended_level}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button"
                                                    className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 group-hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all border border-transparent group-hover:border-red-100"
                                                >
                                                    <span>Detail Hasil</span>
                                                    <ChevronRight size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                            <span>Total: <strong className="text-slate-800">{submissionsPagination.total}</strong> sesi ujian</span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={submissionsPagination.current_page <= 1}
                                    onClick={() => fetchSubmissions(submissionsPagination.current_page - 1)}
                                    className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Sebelumnya
                                </button>
                                <span>Halaman {submissionsPagination.current_page} dari {submissionsPagination.last_page || 1}</span>
                                <button
                                    disabled={submissionsPagination.current_page >= submissionsPagination.last_page}
                                    onClick={() => fetchSubmissions(submissionsPagination.current_page + 1)}
                                    className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AdminPageLayout>

            {/* Create Modal */}
            <Dialog 
                open={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-10 pointer-events-none">
                            <Plus size={200} />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Create Package</h2>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">Set up your assessment parameters</p>

                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Package Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        placeholder="e.g. TOEFL iBT Placement Test"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-100 transition-all"
                                    />
                                    {errors.title && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.title}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Package Category</label>
                                    <select 
                                        required
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-100 transition-all appearance-none"
                                    >
                                        <option value="General">General / Adult Placement</option>
                                        <option value="Kids">Kids Placement (Interactive / Drag & Drop)</option>
                                        <option value="Teens">Teens Placement</option>
                                        <option value="IELTS">IELTS Assessment (Task-based)</option>
                                    </select>
                                    {errors.category && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.category}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Duration (Minutes)</label>
                                    <input 
                                        type="number" 
                                        required
                                        value={data.duration_minutes}
                                        onChange={e => setData('duration_minutes', e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-100 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Notes / Description (WYSIWYG)</label>
                                    <RichTextEditor 
                                        value={data.description}
                                        onChange={val => setData('description', val)}
                                        placeholder="Tulis deskripsi paket, silabus/modul tes, instruksi peserta..."
                                        minHeight="140px"
                                    />
                                    {errors.description && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.description}</p>}
                                </div>

                                <div className="flex items-center gap-5 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={processing}
                                        className="flex-[1.5] bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Initialize Package
                                    </button>
                                </div>
                            </form>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            <SessionResultDetailModal
                show={isResultModalOpen}
                onClose={() => setIsResultModalOpen(false)}
                session={selectedSession}
            />

            <CompletedPtSessionsModal
                isOpen={isCompletedModalOpen}
                onClose={() => setIsCompletedModalOpen(false)}
                exams={exams}
                onViewResult={(session) => {
                    setSelectedSession(session);
                    setIsResultModalOpen(true);
                }}
            />
            
            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}} />
        </AdminLayout>
    );
}
