import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
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
import { useEffect } from 'react';

import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import AdminCard from '@/Components/shared/AdminCard';
import SessionResultDetailModal from '../drawers/modals/SessionResultDetailModal';

export default function Index({ stats, sessions, exams }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    
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

                {/* Category Navigation Tabs */}
                <div className="flex border-b border-slate-200 gap-8">
                    {[
                        { id: 'all', label: 'Semua Paket', count: (exams.data || []).length },
                        { id: 'General', label: 'General / Adult', dot: 'bg-blue-500', count: (exams.data || []).filter(e => (e.category || 'General') === 'General').length },
                        { id: 'Kids', label: 'Kids Placement', dot: 'bg-amber-500', count: (exams.data || []).filter(e => e.category === 'Kids').length },
                        { id: 'IELTS', label: 'IELTS Assessment', dot: 'bg-indigo-500', count: (exams.data || []).filter(e => e.category === 'IELTS').length },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                                activeTab === tab.id
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                activeTab === tab.id ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Left: Recent Activity */}
                    <div className="xl:col-span-4 space-y-4">
                        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">Recent Activity</h2>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Live candidate submissions</p>
                                </div>
                                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                                    {sessions.data.length} Sessions
                                </span>
                            </div>

                            <div className="space-y-3">
                                {sessions.data.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-3">
                                            <Users size={24} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">Belum ada riwayat tes terbaru</p>
                                    </div>
                                ) : (
                                    sessions.data.map((session) => (
                                        <div 
                                            key={session.id} 
                                            onClick={() => handleViewResult(session)}
                                            className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all cursor-pointer group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-black text-xs border border-slate-200/60 uppercase group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-100 transition-colors">
                                                {session.lead_name?.charAt(0) || 'S'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-black text-slate-900 truncate tracking-tight group-hover:text-red-600 transition-colors">
                                                        {session.lead_name}
                                                    </p>
                                                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider shrink-0 ${getStatusStyle(session.status)}`}>
                                                        {session.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                                                    {session.pt_exam?.title}
                                                </p>
                                            </div>
                                            {session.status === 'completed' && session.final_score !== null && (
                                                <div className="text-right shrink-0">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                        <Trophy size={11} /> {session.final_score}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Examination Packages */}
                    <div className="xl:col-span-8 space-y-4">
                        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6">
                            {/* Search & Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">Daftar Paket Soal</h2>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Pilih paket untuk mengelola soal atau membuat sesi ujian</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari paket ujian..." 
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold w-full sm:w-60 focus:bg-white focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Packages Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {filteredExams.map((exam) => {
                                    const cat = getCategoryBadge(exam.category);
                                    return (
                                        <div 
                                            key={exam.id} 
                                            className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/5 transition-all group flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Top Badge & Actions */}
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${cat.bg}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                                                        {cat.label}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <Link 
                                                            href={route('admin.placement-tests.show', exam.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Edit / Kelola Soal"
                                                        >
                                                            <Edit2 size={14} />
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
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                exam.has_sessions 
                                                                    ? 'text-slate-200 cursor-not-allowed' 
                                                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                                            }`}
                                                            title={exam.has_sessions ? 'Tidak bisa dihapus (sudah dipakai)' : 'Hapus Paket'}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Title & Description */}
                                                <h3 className="text-sm font-black text-slate-900 mb-1 group-hover:text-red-600 transition-colors tracking-tight line-clamp-1">
                                                    {exam.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4">
                                                    {exam.description || 'Tidak ada deskripsi paket.'}
                                                </p>
                                            </div>

                                            {/* Footer Info & Action */}
                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} className="text-slate-400" /> {exam.duration_minutes}m
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <FileText size={12} className="text-slate-400" /> {exam.questions_count} Soal
                                                    </span>
                                                </div>

                                                <Link 
                                                    href={route('admin.placement-tests.show', exam.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-black text-red-600 hover:text-red-700 uppercase tracking-wider"
                                                >
                                                    Kelola Soal <ArrowUpRight size={13} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* New Package Box */}
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-red-50/40 hover:border-red-300 transition-all group cursor-pointer min-h-[160px]"
                                >
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                                        <Plus size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-slate-700 group-hover:text-red-600 uppercase tracking-wider">Tambah Paket Baru</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Buat paket ujian baru (General, Kids, IELTS)</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminPageLayout>

            {/* Create Modal */}
            <Dialog 
                open={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden">
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
                                        placeholder="e.g., IELTS Placement Diagnostic"
                                        className={`w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-100 transition-all ${errors.title ? 'ring-2 ring-red-500' : ''}`}
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
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Notes / Description</label>
                                    <textarea 
                                        rows="3"
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-red-100 transition-all resize-none"
                                    />
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
            
            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}} />
        </AdminLayout>
    );
}
