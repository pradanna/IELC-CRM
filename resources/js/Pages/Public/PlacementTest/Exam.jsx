import React from "react";
import { Head } from "@inertiajs/react";
import { Clock, ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { usePlacementTest } from "./hooks/usePlacementTest";

export default function Exam({
    session,
    exam_title,
    pages,
    is_review = false,
    user_answers = {},
}) {
    const {
        currentPageIndex,
        setCurrentPageIndex,
        mainRef,
        timeLeft,
        formatTime,
        questionMap,
        handleOptionSelect,
        confirmFinish,
        getTimerColorClass,
        answers,
        processing,
    } = usePlacementTest({ session, pages, isReview: is_review, userAnswers: user_answers });

    const activePage = pages[currentPageIndex];

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
                            {questionMap.map((q) => {
                                const isAnswered = answers[q.id] !== undefined;
                                const isCurrentPage = currentPageIndex === q.pageIndex;

                                let buttonClass = "";
                                if (is_review) {
                                    const pageData = pages[q.pageIndex];
                                    const questionData = pageData.questions.find(x => x.id === q.id);
                                    const userAnswerId = answers[q.id];
                                    const correctOption = questionData.options.find(opt => opt.is_correct);

                                    if (userAnswerId === correctOption?.id) {
                                        buttonClass = "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
                                    } else {
                                        buttonClass = "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200";
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
                            })}
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
                        {/* Group Header (if any) */}
                        {activePage.type === "group" && (
                            <div className="mb-10 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center gap-2 text-primary-600 mb-4">
                                    <AlertCircle size={18} />
                                    <h3 className="font-bold text-[10px] uppercase tracking-[0.2em]">
                                        Instructions
                                    </h3>
                                </div>
                                <p className="text-md text-gray-800 font-medium mb-6 leading-relaxed">
                                    {activePage.instruction}
                                </p>

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
                                        
                                        {q.audio_path && (
                                            <audio controls className="w-full max-w-sm mb-6 h-10">
                                                <source src={q.audio_path} type="audio/mpeg" />
                                            </audio>
                                        )}

                                        <div className="grid grid-cols-1 gap-3">
                                            {q.options.map((opt, idx) => {
                                                const isSelected = answers[q.id] === opt.id;
                                                let optionStyle = isSelected
                                                    ? "bg-primary-50 border-primary-400 ring-2 ring-primary-400/20"
                                                    : "bg-white border-gray-100 shadow-sm hover:border-primary-200 hover:bg-gray-50/50";
                                                
                                                let reviewBadge = null;

                                                if (is_review) {
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
                                    </div>
                                </div>
                            </div>
                        ))}

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
                                !is_review && (
                                    <button
                                        onClick={confirmFinish}
                                        disabled={processing}
                                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Finish Test <Check size={18} />
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
