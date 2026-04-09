import React from "react";
import { Head } from "@inertiajs/react";
import { CheckCircle, Trophy, Target, Sparkles, MessageCircle } from "lucide-react";

export default function Result({ session, exam, stats }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Head title={`Test Results - ${exam.title}`} />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 mb-6 shadow-xl shadow-emerald-500/10">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    Assessment Complete!
                </h2>
                <p className="mt-2 text-sm text-gray-500 font-medium italic">
                    You've taken the first step towards excellence.
                </p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-8 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 text-center relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 p-8 text-primary-50 opacity-10 pointer-events-none">
                        <Sparkles size={120} />
                    </div>

                    <div className="relative z-10">
                        <p className="text-md text-gray-600 mb-2">Well done,</p>
                        <h3 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">
                            {session.lead_name}
                        </h3>

                        <div className="grid grid-cols-1 gap-6 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 mb-8">
                            {/* Score Display */}
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Trophy size={14} className="text-amber-500" />
                                    Overall Performance Score
                                </p>
                                <div className="relative">
                                    <p className="text-6xl font-black text-primary-600 drop-shadow-sm">
                                        {session.final_score}
                                    </p>
                                    <div className="absolute -top-2 -right-4">
                                        <Sparkles size={20} className="text-amber-400 animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                            {/* Stats Display */}
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <Target size={14} className="text-blue-500" />
                                    Assessment Metrics
                                </p>
                                <p className="text-sm text-gray-700 font-bold">
                                    <span className="text-emerald-600">{stats.correct_answers}</span> Correct Out of <span className="text-gray-900">{stats.total_questions}</span> Questions
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 rounded-2xl p-5 mb-8 border border-blue-100">
                            <div className="flex items-center gap-3 text-blue-700 mb-2 justify-center">
                                <MessageCircle size={18} />
                                <span className="text-xs font-black uppercase tracking-wider">Next Step</span>
                            </div>
                            <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                Our academic consultant will review your results and contact you shortly to recommend the most suitable course level for your goals.
                            </p>
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium">
                            You may now securely close this window.
                        </p>
                    </div>
                </div>
                
                <p className="mt-10 text-center text-xs text-gray-400 font-medium">
                    &copy; {new Date().getFullYear()} IELC. All rights reserved.
                </p>
            </div>
        </div>
    );
}
