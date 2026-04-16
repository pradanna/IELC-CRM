import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/Components/ui/Modal';
import Exam from '@/Pages/Public/PlacementTest/Exam';
import { Loader2, AlertCircle, FileText, CheckCircle2, Save, Star, Download, Paperclip } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/form/PrimaryButton';
import InputLabel from '@/Components/form/InputLabel';
import TextInput from '@/Components/form/TextInput';

export default function SessionResultDetailModal({ show, onClose, session }) {
    const { data: gradeForm, setData: setGradeData, patch, processing: grading } = useForm({
        final_score: session?.final_score || 0,
        recommended_level: session?.recommended_level || '',
        grading_notes: session?.grading_notes || '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (show && session?.id) {
            fetchDetails();
            setGradeData({
                final_score: session.final_score || 0,
                recommended_level: session.recommended_level || '',
                grading_notes: session.grading_notes || '',
            });
        }
    }, [show, session]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(route('admin.crm.pt-sessions.get-result', session.id));
            setData(response.data);
            
            // Re-sync form with fresh data if already graded
            if (response.data.session) {
                setGradeData({
                    final_score: response.data.session.final_score || 0,
                    recommended_level: response.data.session.recommended_level || '',
                    grading_notes: response.data.session.grading_notes || '',
                });
            }
        } catch (err) {
            console.error('Error fetching session results:', err);
            setError('Failed to load assessment results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGrade = () => {
        patch(route('admin.crm.pt-sessions.update-grade', session.id), {
            onSuccess: () => {
                // We might want to refresh the local state or lead data
            }
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="6xl">
            <div className="h-[85vh] flex flex-col overflow-hidden rounded-2xl">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <FileText size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest">
                                Assessment Review: {session?.pt_exam?.title}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Candidate: {session?.lead_name} • Score: <span className="text-emerald-400">{session?.final_score}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-black transition-all"
                    >
                        Close Review
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative bg-slate-50">
                    {loading || !data ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Results...</p>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Data Retrieval Failed</h3>
                            <p className="text-sm text-slate-500 max-w-xs">{error}</p>
                            <button 
                                onClick={fetchDetails}
                                className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all"
                            >
                                Retry Loading
                            </button>
                        </div>
                    ) : (
                        <div className="h-full flex overflow-hidden">
                            {/* Exam Review (Scrollable) */}
                            <div className="flex-1 h-full overflow-hidden">
                                <Exam 
                                    exam_title={data.exam.title}
                                    exam_category={data.exam.category}
                                    pages={data.exam.pages}
                                    session={{ 
                                        token: 'review', 
                                        remaining_seconds: 0
                                    }}
                                    is_review={true}
                                    user_answers={data.answers}
                                />
                            </div>

                            {/* Grading Sidebar - Only for IELTS */}
                            {data.exam.category === 'IELTS' && (
                                <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
                                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center gap-2 text-slate-900 mb-1">
                                            <Star size={16} className="text-amber-500 fill-amber-500" />
                                            <h3 className="text-xs font-black uppercase tracking-widest">Grading & Feedback</h3>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Evaluation</p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                        {session?.result_file_url && (
                                            <div className="animate-in fade-in slide-in-from-right-4">
                                                <div className="bg-primary-50 border-2 border-primary-100 border-dashed rounded-2xl p-4 text-center">
                                                    <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-500/20">
                                                        <Paperclip size={18} />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Work Summary Bundle</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Complete Student Answers</p>
                                                    
                                                    <a 
                                                        href={session.result_file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
                                                    >
                                                        <Download size={14} />
                                                        Download Work
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel value="Final Adjusted Score" className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2" />
                                                <div className="relative">
                                                    <TextInput 
                                                        type="number"
                                                        value={gradeForm.final_score}
                                                        onChange={e => setGradeData('final_score', e.target.value)}
                                                        className="w-full text-lg font-black bg-slate-50 border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 rounded-2xl py-3"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Points</div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold mt-2 italic">* MCQ score was initially {data.session.final_score}</p>
                                            </div>

                                            <div>
                                                <InputLabel value="Recommended Level" className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2" />
                                                <TextInput 
                                                    value={gradeForm.recommended_level}
                                                    onChange={e => setGradeData('recommended_level', e.target.value)}
                                                    className="w-full text-sm font-bold bg-slate-50 border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 rounded-2xl"
                                                    placeholder="e.g. Intermediate 2"
                                                />
                                            </div>

                                            <div>
                                                <InputLabel value="Grading Notes" className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2" />
                                                <textarea 
                                                    className="w-full bg-slate-50 border-slate-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all p-4 shadow-sm min-h-[150px]"
                                                    placeholder="Consultant's review notes..."
                                                    value={gradeForm.grading_notes}
                                                    onChange={e => setGradeData('grading_notes', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {data.session.is_graded && (
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                                                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest leading-none mb-1">Graded</p>
                                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">By {data.session.grader_name || 'System'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                                        <PrimaryButton 
                                            className="w-full justify-center py-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                            onClick={handleSaveGrade}
                                            disabled={grading}
                                        >
                                            <Save size={18} className="mr-2" />
                                            {data.session.is_graded ? 'Update Grade' : 'Submit Grade'}
                                        </PrimaryButton>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
