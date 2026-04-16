import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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

import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import AdminCard from '@/Components/shared/AdminCard';

export default function Index({ stats, sessions, exams }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
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

    return (
        <AdminLayout>
            <Head title="Placement Test Dashboard" />

            <AdminPageLayout
                title="Placement Test"
                subtitle="Assessment Packages & Monitoring"
                actions={
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-red-500/20 transition-all active:scale-95 group"
                    >
                        <Plus size={18} />
                        Create New Package
                    </button>
                }
            >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                    {[
                        { label: 'Assigned Today', value: stats.today, icon: Calendar, color: 'bg-amber-500' },
                        { label: 'Live Now', value: stats.in_progress, icon: PlayCircle, color: 'bg-blue-500', active: true },
                        { label: 'Completed Today', value: stats.completed_today, icon: CheckCircle2, color: 'bg-emerald-500' }
                    ].map((stat, i) => (
                        <AdminCard key={i} className="relative group" padding="p-8">
                            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon size={80} />
                            </div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/10`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                                </div>
                                {stat.active && (
                                    <div className="ml-auto">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                            Active
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AdminCard>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Active Sessions */}
                    <div className="xl:col-span-4 flex flex-col gap-6">
                        <AdminCard padding="p-8" className="flex-1">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase text-xs opacity-50">Recent Activity</h2>
                                <Link className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:translate-x-1 transition-transform inline-flex items-center gap-1 uppercase">
                                    View All <ChevronRight size={14} />
                                </Link>
                            </div>

                            <div className="space-y-6">
                                {sessions.data.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                                            <Users size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400 italic">No recent sessions found.</p>
                                    </div>
                                ) : (
                                    sessions.data.map((session) => (
                                        <div key={session.id} className="flex items-start gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors group">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all shrink-0 uppercase font-black text-xs">
                                                {session.lead_name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-black text-slate-900 truncate tracking-tight">{session.lead_name}</p>
                                                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider shrink-0 ${getStatusStyle(session.status)}`}>
                                                        {session.status}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                                                    <FileText size={10} /> {session.pt_exam?.title}
                                                </p>
                                                {session.status === 'completed' && (
                                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-lg border border-emerald-100">
                                                        <Trophy size={10} /> Score: {session.final_score}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </AdminCard>
                    </div>

                    {/* Exam Packages */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        <AdminCard padding="p-8" className="flex-1">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">Examination Packages</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Search packages..." 
                                        className="bg-slate-50 border-none rounded-2xl pl-10 pr-4 py-2 text-sm font-bold w-64 focus:ring-2 focus:ring-red-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {exams.data.map((exam) => (
                                    <div key={exam.id} className="bg-slate-50/50 border border-slate-100 rounded-sm p-6 hover:bg-white hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all group relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                                                <FileText size={24} />
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link 
                                                    href={route('admin.placement-tests.show', exam.id)}
                                                    className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-sm transition-all"
                                                >
                                                    <Edit2 size={14} />
                                                </Link>
                                            </div>
                                        </div>

                                        <h3 className="text-md font-black text-slate-900 mb-2 truncate group-hover:text-red-600 transition-colors">{exam.title}</h3>
                                        
                                        <div className="flex items-center gap-4 mt-auto">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                <Clock size={12} /> {exam.duration_minutes}m
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                <Users size={12} /> {exam.questions_count} Qs
                                            </div>
                                            <div className={`ml-auto w-2 h-2 rounded-full ${exam.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        </div>

                                        <Link 
                                            href={route('admin.placement-tests.show', exam.id)}
                                            className="absolute inset-x-0 bottom-0 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest text-center rounded-b-[2rem] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all"
                                        >
                                            Enter Builder <ArrowUpRight size={12} className="inline ml-1" />
                                        </Link>
                                    </div>
                                ))}

                                {/* Empty Template */}
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="border-4 border-dashed border-slate-100 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-4 hover:bg-white hover:border-red-200 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                        <Plus size={24} />
                                    </div>
                                    <p className="text-sm font-black text-slate-400 group-hover:text-red-600">New Package</p>
                                </button>
                            </div>
                        </AdminCard>
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
                    <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
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
                                        <option value="General">General Placement (MCQ-based)</option>
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
            
            <style dangerouslySetInnerHTML={{ __html: `
                .scrollbar-thin::-webkit-scrollbar { width: 4px; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}} />
        </AdminLayout>
    );
}
