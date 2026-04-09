import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Clock, BookOpen, AlertCircle, Play } from "lucide-react";

export default function Landing({ session, exam }) {
    const startUrl = route('public.placement-test.start', { token: session.token });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Head title={`Placement Test - ${exam.title}`} />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 mb-6">
                    <BookOpen size={32} />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    IELC Placement Test
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Online Adaptive Assessment System
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-10">
                    <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Welcome,</p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {session.lead_name}
                        </h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 leading-tight">
                                {exam.title}
                            </h4>
                            {exam.description && (
                                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                    {exam.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 py-6 border-y border-gray-100">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/50 text-sm text-gray-700 font-medium">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary-600 shadow-sm">
                                    <Clock size={16} />
                                </div>
                                <span>
                                    Test Duration: <strong className="text-primary-700">{exam.duration_minutes} Minutes</strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 text-sm text-gray-700 font-medium">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                    <AlertCircle size={16} />
                                </div>
                                <span>Auto-submit when time expires.</span>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle
                                size={20}
                                className="text-amber-600 mt-0.5 shrink-0"
                            />
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                Ensure a stable internet connection. Once you click start, 
                                <strong> the timer will run continuously </strong> and cannot be paused.
                            </p>
                        </div>

                        <Link
                            href={startUrl}
                            method="post"
                            as="button"
                            className="group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-primary-500/20 text-md font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all active:scale-[0.98]"
                        >
                            <Play size={18} className="fill-current" />
                            {session.status === "in_progress"
                                ? "Resume Placement Test"
                                : "Start Placement Test"}
                        </Link>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} IELC. All rights reserved.
                </p>
            </div>
        </div>
    );
}
