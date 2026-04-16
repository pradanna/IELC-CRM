import React from "react";
import { Head } from "@inertiajs/react";
import { Clock, ChevronLeft, ChevronRight, Check, AlertCircle, FileText, ExternalLink, Music, Download } from "lucide-react";
import { usePlacementTest } from "./hooks/usePlacementTest";
import { Upload, File, Type } from "lucide-react";

export default function Exam({
    session,
    exam_title,
    exam_category = 'General',
    pages,
    is_review = false,
    user_answers = {},
}) {
    const [showFinalStep, setShowFinalStep] = React.useState(false);
    const {
        currentPageIndex,
        setCurrentPageIndex,
        mainRef,
        timeLeft,
        formatTime,
        questionMap,
        handleOptionSelect,
        handleTextChange,
        handleFileSelect,
        confirmFinish,
        getTimerColorClass,
        answers,
        summaryFile,
        setData,
        processing,
    } = usePlacementTest({ session, pages, isReview: is_review, userAnswers: user_answers });

    const activePage = pages[currentPageIndex];

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

    const qMapIndicator = (q) => {
        const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== '';
        const isCurrentPage = currentPageIndex === q.pageIndex;

        let buttonClass = "";
        if (is_review) {
            const pageData = pages[q.pageIndex];
            const qData = pageData.questions.find(x => x.id === q.id);
            const ans = answers[q.id];

            if (qData.type === 'mcq') {
                const correctOption = qData.options.find(opt => opt.is_correct);
                if (ans?.option_id === correctOption?.id) {
                    buttonClass = "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
                } else {
                    buttonClass = "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200";
                }
            } else {
                buttonClass = "bg-blue-100 text-blue-800 border-blue-300";
            }
        } else {
            buttonClass = isAnswered
                ? "bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300";
        }

        return (
            <button
                key={q.number}
                onClick={() => setCurrentPageIndex(q.pageIndex)}
                className={`h-11 w-full flex items-center justify-center rounded-xl text-xs font-bold border transition-all duration-200 ${
                    isCurrentPage
                        ? "ring-4 ring-primary-500/10 border-primary-500 shadow-md transform scale-105 z-10"
                        : ""
                } ${buttonClass}`}
            >
                {q.number}
            </button>
        );
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            <Head title={`Taking Test - ${exam_title}`} />

            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
                        <Check size={18} strokeWidth={3} />
                    </div>
                    <div className="font-bold text-gray-900 tracking-tight">
                        {exam_title}
                    </div>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm font-bold shadow-sm transition-all duration-300 ${getTimerColorClass()}`}>
                    <Clock size={16} />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            Question Map
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                        <div className="grid grid-cols-4 gap-2.5">
                            {questionMap.map((q) => qMapIndicator(q))}
                        </div>
                    </div>
                    <div className="p-5 border-t border-gray-200 bg-gray-50/30">
                        {!is_review && (
                            <button
                                onClick={confirmFinish}
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                <Check size={18} /> Finish Test
                            </button>
                        )}
                        {is_review && (
                             <button
                                onClick={() => window.close()}
                                className="w-full inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-gray-500/20 transition-all active:scale-[0.98]"
                            >
                                Close Review
                            </button>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main ref={mainRef} className="flex-1 overflow-y-auto bg-gray-50/50 relative scroll-smooth px-8">
                    <div className="max-w-3xl mx-auto py-12 pb-32">
                        {/* Final Submission Step (IELTS) */}
                        {showFinalStep ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-10 bg-white border-2 border-primary-100 border-dashed rounded-[32px] p-12 text-center shadow-2xl shadow-primary-500/5">
                                    <div className="w-20 h-20 bg-primary-600 text-white rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/40">
                                        <Upload size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Final Step: Upload Your Work</h3>
                                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-10 font-medium">
                                        Please upload the document or zip file containing all your answers for this assessment.
                                    </p>

                                    <div className="relative max-w-md mx-auto group">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={(e) => setData('summary_file', e.target.files[0])}
                                        />
                                        <div className={`border-2 border-dashed rounded-[24px] p-8 flex flex-col items-center gap-3 transition-all ${
                                            summaryFile ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 group-hover:border-primary-300 group-hover:bg-primary-50/50'
                                        }`}>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                                                summaryFile ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'
                                            }`}>
                                                {summaryFile ? <Check size={20} /> : <FileText size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                                    {summaryFile ? summaryFile.name : 'Select Your Work Bundle'}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF, ZIP, or DOCX (Max 20MB)</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 flex items-center justify-center gap-4">
                                        <button 
                                            onClick={() => setShowFinalStep(false)}
                                            className="px-8 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
                                        >
                                            Go Back
                                        </button>
                                        <button 
                                            disabled={!summaryFile || processing}
                                            onClick={confirmFinish}
                                            className="px-10 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                                        >
                                            Submit Everything
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                        <>
                        {/* Group Header (if any) */}
                        {activePage.type === "group" && (
                            <div className="mb-10 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                                {/* Section Type Badge */}
                                {activePage.section_type && (
                                    <div className="mb-5">
                                        {activePage.section_type === 'reading' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                                Reading Section
                                            </span>
                                        ) : activePage.section_type === 'listening' ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                                                Listening Section
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] bg-violet-50 text-violet-600 border border-violet-100 shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                                Speaking Section
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-primary-600 mb-4">
                                    <AlertCircle size={18} />
                                    <h3 className="font-bold text-[10px] uppercase tracking-[0.2em]">
                                        Instructions
                                    </h3>
                                </div>
                                <p className="text-md text-gray-800 font-medium mb-6 leading-relaxed">
                                    {activePage.instruction}
                                </p>

                                {activePage.file_path && (
                                    <div className="mb-6 flex flex-wrap gap-3">
                                        <a
                                            href={activePage.file_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-primary-500 hover:bg-primary-50 text-slate-700 hover:text-primary-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group"
                                        >
                                            <FileText size={16} className="text-slate-400 group-hover:text-primary-500" />
                                            <span>Download Reading Resource</span>
                                            <ExternalLink size={14} className="opacity-40" />
                                        </a>
                                    </div>
                                )}

                                {activePage.audio_path && (
                                    <audio controls className="w-full max-w-sm mb-6 h-10">
                                        <source src={activePage.audio_path} type="audio/mpeg" />
                                    </audio>
                                )}
                                {activePage.reading_text && (
                                    <div className="text-md bg-gray-50 p-8 rounded-2xl border border-gray-100 text-gray-700 leading-[1.8] italic whitespace-pre-wrap relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-200" />
                                        {activePage.reading_text}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Questions */}
                        {activePage.questions.map((q) => (
                            <div
                                key={q.id}
                                className="mb-8 bg-white border border-gray-200 shadow-sm rounded-3xl p-8 transition-all hover:shadow-gray-200/50"
                            >
                                <div className="flex gap-6">
                                    <div className="shrink-0 w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-gray-900/10">
                                        {q.number}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="text-lg font-bold text-gray-900 mb-6 leading-snug">
                                            {q.text}
                                        </p>
                                        
                                        {/* Question Content (Hidden for IELTS) */}
                                        {exam_category !== 'IELTS' && (
                                            <>
                                        {/* MCQ Rendering */}
                                        {q.type === 'mcq' && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {q.options.map((opt, idx) => {
                                                    const isSelected = is_review 
                                                        ? answers[q.id]?.option_id === opt.id
                                                        : answers[q.id] === opt.id;
                                                    
                                                    let optionStyle = isSelected
                                                        ? "bg-primary-50 border-primary-400 ring-2 ring-primary-400/20"
                                                        : "bg-white border-gray-100 shadow-sm hover:border-primary-200 hover:bg-gray-50/50";
                                                    
                                                    let reviewBadge = null;

                                                    if (is_review) {
                                                        const isCorrectAns = answers[q.id]?.is_correct;
                                                        optionStyle = "bg-white border-gray-100 opacity-60";
                                                        if (opt.is_correct && isSelected) {
                                                            optionStyle = "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/10 opacity-100 shadow-md";
                                                            reviewBadge = <span className="ml-auto text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg uppercase tracking-wider">Correct Answer</span>;
                                                        } else if (opt.is_correct && !isSelected) {
                                                            optionStyle = "bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/10 opacity-100 shadow-md translate-x-1";
                                                            reviewBadge = <span className="ml-auto text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg uppercase tracking-wider">Correct Answer</span>;
                                                        } else if (!opt.is_correct && isSelected) {
                                                            optionStyle = "bg-rose-50 border-rose-500 ring-4 ring-rose-500/10 opacity-100 shadow-md";
                                                            reviewBadge = <span className="ml-auto text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-1 rounded-lg uppercase tracking-wider">Your Answer</span>;
                                                        }
                                                    }

                                                    return (
                                                        <label
                                                            key={opt.id}
                                                            className={`flex items-center gap-4 p-4 border rounded-2xl transition-all duration-200 ${!is_review ? "cursor-pointer active:scale-[0.99]" : ""} ${optionStyle}`}
                                                        >
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isSelected ? "bg-primary-600 border-primary-600 text-white" : "border-gray-200 text-gray-400"}`}>
                                                                <span className="text-[10px] font-black">{String.fromCharCode(65 + idx)}</span>
                                                            </div>
                                                            <input
                                                                type="radio"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                disabled={is_review}
                                                                onChange={() => handleOptionSelect(q.id, opt.id)}
                                                            />
                                                            <span className={`text-sm font-bold ${isSelected ? "text-primary-900" : "text-gray-600"}`}>
                                                                {opt.text}
                                                            </span>
                                                            {reviewBadge}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Essay / Text Rendering */}
                                        {q.type === 'text' && (
                                            <div className="space-y-4">
                                                {is_review ? (
                                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                                                        {answers[q.id]?.answer_text || "(No answer provided)"}
                                                    </div>
                                                ) : (
                                                    <textarea 
                                                        className="w-full bg-white border-gray-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all p-4 shadow-sm min-h-[200px]"
                                                        placeholder="Type your answer here..."
                                                        value={answers[q.id] || ''}
                                                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* File Upload Rendering */}
                                        {q.type === 'file' && (
                                            <div className="space-y-4">
                                                {is_review ? (
                                                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-primary-600">
                                                                <File size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Attachment Answer</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Uploaded Document</p>
                                                            </div>
                                                        </div>
                                                        {answers[q.id]?.file_path ? (
                                                            <a 
                                                                href={answers[q.id].file_path} 
                                                                target="_blank"
                                                                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md"
                                                            >
                                                                Download / View
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No file uploaded</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="relative group">
                                                        <input 
                                                            type="file" 
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            onChange={(e) => handleFileSelect(q.id, e.target.files[0])}
                                                        />
                                                        <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 transition-all ${
                                                            answers[q.id] instanceof File 
                                                            ? 'border-emerald-200 bg-emerald-50/50' 
                                                            : 'border-slate-200 bg-slate-50/50 group-hover:border-primary-200 group-hover:bg-primary-50/30'
                                                        }`}>
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                                                                answers[q.id] instanceof File 
                                                                ? 'bg-emerald-600 text-white' 
                                                                : 'bg-white text-slate-400'
                                                            }`}>
                                                                {answers[q.id] instanceof File ? <Check size={24} /> : <Upload size={24} />}
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                                                    {answers[q.id] instanceof File ? answers[q.id].name : 'Upload Your Assignment'}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                                    PDF or DOCX (Max 10MB)
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        </>
                        )}

                        {/* Pagination Footer */}
                        <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-8 pb-20">
                            <button
                                onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                                disabled={currentPageIndex === 0}
                                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-2xl transition-all ${
                                    currentPageIndex === 0
                                        ? "opacity-0 invisible pointer-events-none"
                                        : "bg-white text-gray-700 border border-gray-200 shadow-lg shadow-gray-200/50 hover:bg-gray-50 active:scale-95"
                                }`}
                            >
                                <ChevronLeft size={18} /> Previous
                            </button>

                            {currentPageIndex < pages.length - 1 ? (
                                <button
                                    onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-gray-900 rounded-2xl shadow-lg shadow-gray-900/10 hover:bg-black transition-all active:scale-95"
                                >
                                    Next <ChevronRight size={18} />
                                </button>
                            ) : (
                                !is_review && !showFinalStep && (
                                    <button
                                        onClick={() => {
                                            if (exam_category === 'IELTS') {
                                                setShowFinalStep(true);
                                            } else {
                                                confirmFinish();
                                            }
                                        }}
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {exam_category === 'IELTS' ? 'Next: Final Submission' : 'Finish Test'} <Check size={18} />
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </main>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}} />
        </div>
    );
}
