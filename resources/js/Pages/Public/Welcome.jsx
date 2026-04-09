import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Sparkles, ArrowRight, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';

export default function Welcome({ branch }) {
    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center text-white font-sans selection:bg-red-600 selection:text-white overflow-hidden bg-slate-900">
            <Head title={`Welcome to IELC ${branch.name}`} />

            {/* Premium Full-Screen Background Image */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/assets/images/local/background-welcomepage.jpg" 
                    alt="IELC Background" 
                    className="w-full h-full object-cover opacity-60 scale-105 animate-in slide-in-from-bottom-4 duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>

            {/* Minimalist Content */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
                <div className="mb-12 animate-in fade-in zoom-in duration-700">
                     
                </div>

                <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-12 animate-in slide-in-from-bottom-8 duration-700 delay-100 italic uppercase">
                    Start Your <br />
                    <span className="text-red-600 not-italic">Journey</span> <br /> 
                    at IELC {branch.name}.
                </h1>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 w-full flex justify-center">
                    <Link
                        href={route('public.join.form', branch.name.toLowerCase())}
                        className="group relative px-12 py-6 bg-red-600 text-white rounded-full font-black uppercase tracking-[0.2em] text-sm transition-all hover:bg-white hover:text-red-600 hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(220,38,38,0.3)] overflow-hidden whitespace-nowrap"
                    >
                        <span className="relative z-10 flex items-center gap-4">
                            Mulai Isi Data Pribadi
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </span>
                    </Link>
                </div>
            </main>

            {/* Subtle Footer Branding */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">
                    Official Registration Portal &bull; IELC Language Center
                </p>
            </div>
        </div>
    );
}
