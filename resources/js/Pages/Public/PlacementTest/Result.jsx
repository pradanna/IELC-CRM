import React from "react";
import { Head } from "@inertiajs/react";
import { CheckCircle, Trophy, Target, Sparkles, MessageCircle, ArrowRight, ExternalLink } from "lucide-react";

export default function Result({ session, exam, stats }) {
    const percentage = Math.round((stats.correct_answers / stats.total_questions) * 100);

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <Head title={`Assessment Result - ${exam.title}`} />

            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-50 rounded-full blur-[120px] opacity-60 animate-pulse" />
                <div className="absolute top-[60%] -right-[10%] w-[35%] h-[45%] bg-blue-50 rounded-full blur-[100px] opacity-50" />
            </div>

            <div className="w-full max-w-xl relative z-10">
                {/* Header Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="inline-flex items-center justify-center p-1 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 mb-8 transform hover:scale-105 transition-transform duration-500">
                        <div className="w-20 h-20 rounded-[1.25rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                            <CheckCircle size={42} strokeWidth={1.5} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                        Assessment Complete
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-8 bg-slate-200" />
                        <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">
                            Level Proficiency Report
                        </p>
                        <div className="h-px w-8 bg-slate-200" />
                    </div>
                </div>

                {/* Main Result Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-200">
                    <div className="p-10 text-center relative">
                        {/* Summary Header */}
                        <div className="inline-block px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                            Academic Summary
                        </div>
                        
                        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                            {session.lead_name}
                        </h2>
                        <p className="text-sm text-slate-400 font-medium mb-10">
                            Candidate for <span className="text-slate-900 font-bold">{exam.title}</span>
                        </p>

                        {/* Result Stats Grid - Hidden for IELTS */}
                        {exam.category !== 'IELTS' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-8 rounded-[2rem] shadow-sm group hover:border-slate-200 transition-all duration-300">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-100 text-amber-500 mb-4 mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                            <Trophy size={18} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
                                        <div className="flex items-center justify-center gap-1">
                                            <span className="text-5xl font-black text-slate-900 leading-none">{session.final_score}</span>
                                            {session.final_score >= 80 && <Sparkles size={16} className="text-amber-400 self-start animate-bounce" />}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-8 rounded-[2rem] shadow-sm group hover:border-slate-200 transition-all duration-300">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-100 text-blue-500 mb-4 mx-auto shadow-sm group-hover:scale-110 transition-transform">
                                            <Target size={18} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                                        <span className="text-5xl font-black text-slate-900 leading-none">{percentage}%</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-8 py-4 bg-slate-50/50 rounded-2xl border border-slate-100 mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-bold text-slate-500">Correct Answers</span>
                                    </div>
                                    <span className="text-sm font-black text-slate-900">{stats.correct_answers} / {stats.total_questions}</span>
                                </div>
                            </>
                        ) : (
                            <div className="mb-10 p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem] text-center">
                               
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Penilaian Manual Sedang Berjalan</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Karena ini adalah tes IELTS, skor Anda akan dihitung secara manual oleh tim akademik kami berdasarkan dokumen yang Anda unggah.
                                </p>
                            </div>
                        )}

                        {/* Next Steps Banner */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-left relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 text-white overflow-hidden opacity-10 rotate-12 transition-transform duration-700 group-hover:scale-110 translate-x-4">
                                <MessageCircle size={100} />
                            </div>
                            <div className="relative z-10">
                                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-black text-white/90 uppercase tracking-widest mb-4">
                                    What's Next?
                                </span>
                                <p className="text-sm text-white/80 leading-relaxed font-medium mb-6">
                                    Our academic consultant will analyze your performance across all sections and contact you (usually within 24 hours) with a personalized course roadmap.
                                </p>
                                <a 
                                    href="https://ielc.co.id" 
                                    target="_blank"
                                    className="inline-flex items-center gap-2 text-xs font-black text-white group-hover:text-emerald-300 transition-colors"
                                >
                                    Explore Courses <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="bg-slate-50/50 border-t border-slate-100 px-10 py-6 flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle size={12} className="text-emerald-500" />
                            Verified Assessment
                        </div>
                    </div>
                </div>
                
                {/* Closure Credits */}
                <div className="mt-12 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-700 text-slate-400">
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-1">IELC English Education</p>
                    <p className="text-[10px] opacity-60">International English Language Center &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
}
