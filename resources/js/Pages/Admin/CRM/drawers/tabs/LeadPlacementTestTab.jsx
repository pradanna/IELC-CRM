import React, { useState } from 'react';
import { useLeadPlacementTest } from '../hooks/useLeadPlacementTest';
import Modal from '@/Components/ui/Modal';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import DangerButton from '@/Components/form/DangerButton';
import SessionResultDetailModal from '../modals/SessionResultDetailModal';
import MagicLinkBanner from '../components/MagicLinkBanner';

export default function LeadPlacementTestTab({ lead, loading, availableExams = [], onRefresh, isMinimal = false }) {
    const {
        generating,
        sendingWa,
        selectedExamId,
        setSelectedExamId,
        copySuccess,
        isDeleting,
        handleGenerateLink,
        handleSendWa,
        handleCopy,
        handleDelete,
    } = useLeadPlacementTest({ lead, onRefresh });

    const [deleteConfirm, setDeleteConfirm] = useState(null); // Session to delete
    const [waConfirm, setWaConfirm] = useState(null); // Session to send WA
    const [viewResult, setViewResult] = useState(null); // Session to view result

    const confirmDelete = (session) => setDeleteConfirm(session);
    const confirmWa = (session) => {
        if (!lead?.phone) {
            // Usually we'd use a toast here. For now, let's just use the hook's check or a toast.
            return;
        }
        setWaConfirm(session);
    };

    const execDelete = () => {
        if (deleteConfirm) {
            handleDelete(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const execSendWa = () => {
        if (waConfirm) {
            handleSendWa(waConfirm);
            setWaConfirm(null);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return (
            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading assessment data...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Standardized Magic Link Section */}
            <MagicLinkBanner lead={lead} />

            {/* Generate Link Section */}
            <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
                {!isMinimal && (
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h3 className="text-md font-black text-slate-900 leading-none">Generate New Assessment</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Assign a placement test to this lead</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <div className="flex-1">
                        <select 
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                            className="w-full bg-white border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all py-3 px-4 shadow-sm"
                        >
                            <option value="">Select Examination Package...</option>
                            {availableExams.map(exam => (
                                <option key={exam.id} value={exam.id}>{exam.title} ({exam.duration_minutes}m)</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerateLink}
                        disabled={generating || !selectedExamId}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl text-sm font-black shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        {generating ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <LinkIcon size={18} />}
                        Generate Link
                    </button>
                </div>
            </div>

            {/* Assessment History */}
            <div>
                {!isMinimal && (
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Assessment History</h3>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black">{lead?.pt_sessions?.length || 0} Records</span>
                    </div>
                )}

                <div className="space-y-4">
                    {!lead?.pt_sessions?.length ? (
                        <div className="text-center py-12 bg-white border-2 border-dashed border-slate-100 rounded-[2rem]">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <FileText size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-400">No assessment history found for this lead.</p>
                        </div>
                    ) : (
                        lead.pt_sessions.map((session) => (
                            <div key={session.id} className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                            session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {session.status === 'completed' ? <Trophy size={24} /> : <Clock size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-lg font-black text-slate-900 leading-none">{session.pt_exam?.title}</h4>
                                                {getStatusBadge(session.status)}
                                            </div>
                                            <div className="flex items-center gap-4 mt-2.5">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                    <Calendar size={12} />
                                                    {new Date(session.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                {session.status === 'completed' && (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md">
                                                        <Trophy size={12} />
                                                        Score: {session.final_score}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {session.status === 'completed' && (
                                            <button 
                                                onClick={() => setViewResult(session)}
                                                className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-100"
                                                title="View Detailed Results"
                                            >
                                                <FileText size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => confirmDelete(session)}
                                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Session"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Link Display */}
                                {session.status !== 'completed' && (
                                    <div className="mt-6 flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                                            <LinkIcon size={14} />
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Magic Link</p>
                                            <p className="text-xs font-mono text-slate-600 truncate">{session.magic_link}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleCopy(session.magic_link, session.id)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    copySuccess === session.id 
                                                        ? 'bg-emerald-600 text-white' 
                                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                            >
                                                {copySuccess === session.id ? 'Copied!' : 'Copy Link'}
                                            </button>
                                            <button 
                                                onClick={() => handleSendWa(session)}
                                                disabled={sendingWa === session.id}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/wa shadow-sm"
                                                title="Send magic link via WhatsApp"
                                            >
                                                {sendingWa === session.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : <MessageSquare size={14} className="group-hover/wa:scale-110 transition-transform" />}
                                                WhatsApp Link
                                            </button>
                                            <a 
                                                href={session.magic_link} 
                                                target="_blank" 
                                                className="p-2 bg-white text-slate-400 hover:text-red-600 border border-slate-200 rounded-xl transition-all shadow-sm"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Modals */}
            <Modal show={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Are you sure you want to delete this test session? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setDeleteConfirm(null)}>Cancel</SecondaryButton>
                        <DangerButton onClick={execDelete} processing={isDeleting === deleteConfirm?.id}>Delete Session</DangerButton>
                    </div>
                </div>
            </Modal>

            <Modal show={!!waConfirm} onClose={() => setWaConfirm(null)} title="Send via WhatsApp">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Kirim link placement test ke **{lead.name}** via WhatsApp? 
                        <br/><span className="text-xs text-slate-400 mt-2 block italic">Link: {waConfirm?.magic_link}</span>
                    </p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setWaConfirm(null)}>Cancel</SecondaryButton>
                        <PrimaryButton onClick={execSendWa} processing={sendingWa === waConfirm?.id}>Send WhatsApp</PrimaryButton>
                    </div>
                </div>
            </Modal>

            {/* Result Detail Modal */}
            <SessionResultDetailModal 
                show={!!viewResult} 
                onClose={() => setViewResult(null)} 
                session={viewResult} 
            />
        </div>
    );
}
