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
        module_bands: {
            listening: '',
            reading: '',
            writing: '',
            speaking: '',
        },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    // Official IELTS rounding function:
    // avg = sum / count
    // fraction < 0.25 -> round down
    // 0.25 <= fraction < 0.75 -> .5
    // fraction >= 0.75 -> round up
    const calculateOverallIeltsBand = (bands) => {
        const numbers = Object.values(bands)
            .map(v => parseFloat(v))
            .filter(v => !isNaN(v) && v >= 0 && v <= 9);

        if (numbers.length === 0) return null;
        const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const whole = Math.floor(avg);
        const fraction = avg - whole;

        if (fraction < 0.25) return whole;
        if (fraction < 0.75) return whole + 0.5;
        return whole + 1.0;
    };

    const getSuggestedLevel = (band) => {
        if (band >= 7.5) return 'IELTS Advanced / Mastery';
        if (band >= 6.5) return 'IELTS Preparation 2 (Upper Intermediate)';
        if (band >= 5.5) return 'IELTS Preparation 1 (Intermediate)';
        if (band >= 4.5) return 'Pre-IELTS (Foundation)';
        if (band >= 3.5) return 'Elementary English';
        return 'Beginner / General English';
    };

    useEffect(() => {
        if (show && session?.id) {
            fetchDetails();
            setGradeData({
                final_score: session.final_score || 0,
                recommended_level: session.recommended_level || '',
                grading_notes: session.grading_notes || '',
                module_bands: {
                    listening: '',
                    reading: '',
                    writing: '',
                    speaking: '',
                },
            });
        }
    }, [show, session]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(route('admin.crm.pt-sessions.get-result', session.id));
            setData(response.data);
            
            const fetchedSession = response.data.session;
            const moduleScores = response.data.ielts_module_scores || {};

            const initialBands = {
                listening: moduleScores.listening !== null && moduleScores.listening !== undefined ? moduleScores.listening : '',
                reading: moduleScores.reading !== null && moduleScores.reading !== undefined ? moduleScores.reading : '',
                writing: moduleScores.writing !== null && moduleScores.writing !== undefined ? moduleScores.writing : '',
                speaking: moduleScores.speaking !== null && moduleScores.speaking !== undefined ? moduleScores.speaking : '',
            };

            const computedOverall = calculateOverallIeltsBand(initialBands);

            setGradeData({
                final_score: computedOverall !== null ? computedOverall : (fetchedSession?.final_score || 0),
                recommended_level: fetchedSession?.recommended_level || (computedOverall ? getSuggestedLevel(computedOverall) : ''),
                grading_notes: fetchedSession?.grading_notes || '',
                module_bands: initialBands,
            });
        } catch (err) {
            console.error('Error fetching session results:', err);
            setError('Failed to load assessment results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleModuleBandChange = (skill, value) => {
        const updatedBands = {
            ...gradeForm.module_bands,
            [skill]: value,
        };

        const computedOverall = calculateOverallIeltsBand(updatedBands);
        
        setGradeData(prev => ({
            ...prev,
            module_bands: updatedBands,
            final_score: computedOverall !== null ? computedOverall : prev.final_score,
            recommended_level: computedOverall !== null ? getSuggestedLevel(computedOverall) : prev.recommended_level,
        }));
    };

    const handleSaveGrade = () => {
        if (!session?.id) return;
        patch(route('admin.crm.pt-sessions.update-grade', session.id), {
            onSuccess: () => {
                // We might want to refresh the local state or lead data
            }
        });
    };

    if (!show && !session) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="screen">
            <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-3 flex items-center justify-between text-white shrink-0 shadow-md z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                            <FileText size={18} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest leading-tight">
                                Assessment Review: {session?.pt_exam?.title}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Candidate: <span className="text-white">{session?.lead_name}</span> • Score: <span className="text-emerald-400 font-black">{(data?.session?.final_score ?? session?.final_score ?? 0)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                        >
                            <span>Close Review</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-hidden relative bg-slate-50 flex flex-col">
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
                                        {/* Download Complete Answer Sheet PDF Button */}
                                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide">Candidate Answer Sheet</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Listening, Reading & Writing</p>
                                                </div>
                                            </div>
                                            <a 
                                                href={session?.id ? route('admin.crm.pt-sessions.download-writing-pdf', session.id) : '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <Download size={13} />
                                                Download Answer Sheet PDF
                                            </a>
                                        </div>

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
                                            {/* 4 Skills IELTS Bands Grid */}
                                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                                                        Module Band Scores
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                                        Scale 0 - 9.0
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2.5">
                                                    {/* Listening */}
                                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 flex items-center gap-1">
                                                                Listening
                                                            </span>
                                                            {data.ielts_module_scores?.listening !== null && (
                                                                <span className="text-[9px] font-bold text-slate-400">Auto</span>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="9"
                                                            value={gradeForm.module_bands.listening}
                                                            onChange={e => handleModuleBandChange('listening', e.target.value)}
                                                            placeholder="0.0"
                                                            className="w-full text-center text-sm font-black bg-slate-50 border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                                        />
                                                    </div>

                                                    {/* Reading */}
                                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                                                Reading
                                                            </span>
                                                            {data.ielts_module_scores?.reading !== null && (
                                                                <span className="text-[9px] font-bold text-slate-400">Auto</span>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="9"
                                                            value={gradeForm.module_bands.reading}
                                                            onChange={e => handleModuleBandChange('reading', e.target.value)}
                                                            placeholder="0.0"
                                                            className="w-full text-center text-sm font-black bg-slate-50 border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                        />
                                                    </div>

                                                    {/* Writing */}
                                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                                                                Writing
                                                            </span>
                                                            <span className="text-[9px] font-bold text-amber-600">Manual</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="9"
                                                            value={gradeForm.module_bands.writing}
                                                            onChange={e => handleModuleBandChange('writing', e.target.value)}
                                                            placeholder="e.g. 5.5"
                                                            className="w-full text-center text-sm font-black bg-slate-50 border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                                        />
                                                    </div>

                                                    {/* Speaking */}
                                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1">
                                                                Speaking
                                                            </span>
                                                            <span className="text-[9px] font-bold text-purple-600">Manual</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="9"
                                                            value={gradeForm.module_bands.speaking}
                                                            onChange={e => handleModuleBandChange('speaking', e.target.value)}
                                                            placeholder="e.g. 6.0"
                                                            className="w-full text-center text-sm font-black bg-slate-50 border border-slate-200 rounded-lg py-1.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                                        />
                                                    </div>
                                                </div>

                                                <p className="text-[9px] text-slate-400 italic">
                                                    * Masukkan nilai speaking/writing, rata-rata Overall Band dihitung otomatis sesuai standar IELTS.
                                                </p>
                                            </div>

                                            {/* Overall Band Result Card */}
                                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                                            Overall Band Score
                                                        </span>
                                                        <p className="text-[9px] text-slate-400">Rata-rata 4 Module</p>
                                                    </div>
                                                    <div className="text-2xl font-black text-white px-3 py-1 rounded-xl bg-white/10 border border-white/20">
                                                        {gradeForm.final_score || '0.0'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <InputLabel value="Recommended Course / Level" className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2" />
                                                <TextInput 
                                                    value={gradeForm.recommended_level}
                                                    onChange={e => setGradeData('recommended_level', e.target.value)}
                                                    className="w-full text-sm font-bold bg-slate-50 border-slate-200 focus:ring-emerald-100 focus:border-emerald-500 rounded-2xl"
                                                    placeholder="e.g. IELTS Preparation 1"
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
