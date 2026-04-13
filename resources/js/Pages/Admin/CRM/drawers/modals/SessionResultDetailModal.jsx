import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/Components/ui/Modal';
import Exam from '@/Pages/Public/PlacementTest/Exam';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

export default function SessionResultDetailModal({ show, onClose, session }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        if (show && session?.id) {
            fetchDetails();
        }
    }, [show, session]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(route('admin.crm.pt-sessions.get-result', session.id));
            setData(response.data);
        } catch (err) {
            console.error('Error fetching session results:', err);
            setError('Failed to load assessment results. Please try again.');
        } finally {
            setLoading(false);
        }
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
                    {loading ? (
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
                        <div className="h-full overflow-hidden">
                            <Exam 
                                exam_title={data.exam.title}
                                pages={data.exam.pages}
                                session={{ 
                                    token: 'review', 
                                    remaining_seconds: 0
                                }}
                                is_review={true}
                                user_answers={data.answers}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
