import React, { useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Success({ branch = null, message = null }) {
    const logoUrl = "/assets/images/local/logo-full.png";
    const turtleThankYouUrl = "/assets/images/local/ielc-thanks.png";
    const doodleBgUrl = "/assets/images/local/turtle-doodle-bg.webp";
    const ielcWatermarkUrl = "/assets/images/local/IELC-Logo.webp";

    // Tetap auto-redirect setelah 5 detik kembali ke /join tanpa menampilkan angka countdown
    useEffect(() => {
        const timer = setTimeout(() => {
            router.visit(route('public.join.form'));
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title="Pendaftaran Berhasil - IELC" />
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans select-none">
                {/* Full-color Turtle doodle background */}
                <div 
                    className="absolute inset-0 bg-repeat bg-center opacity-85 pointer-events-none"
                    style={{ 
                        backgroundImage: `url(${doodleBgUrl})`,
                        backgroundSize: '540px auto'
                    }}
                />

                {/* Subtle dark vignette overlay to keep text and card prominent while doodle stays vivid */}
                <div className="absolute inset-0 bg-radial from-slate-950/40 via-slate-950/70 to-slate-950/90 pointer-events-none" />

                {/* Large IELC Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <img 
                        src={ielcWatermarkUrl} 
                        alt="IELC Background Watermark" 
                        className="w-[450px] sm:w-[650px] h-auto object-contain opacity-10 filter brightness-200 contrast-125 select-none"
                    />
                </div>

                {/* Subtle ambient glows */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/25 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

                {/* Main Card - matching Error.jsx style */}
                <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/70 p-8 sm:p-10 text-center transition-all">
                    {/* Brand Logo */}
                    <div className="flex justify-center mb-5">
                        <img 
                            src={logoUrl} 
                            alt="IELC Logo" 
                            className="h-12 sm:h-14 w-auto object-contain hover:scale-105 transition-transform duration-300"
                        />
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border mb-4 shadow-2xs bg-emerald-50 text-emerald-600 border-emerald-200">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Berhasil Terkirim</span>
                    </div>

                    {/* Turtle Thank You Mascot Illustration */}
                    <div className="flex justify-center mb-4">
                        <div className="p-2 relative">
                            <img 
                                src={turtleThankYouUrl} 
                                alt="Turtle Thank You Mascot" 
                                className="w-40 h-40 sm:w-48 sm:h-48 object-contain filter drop-shadow-lg hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
                            />
                        </div>
                    </div>

                    {/* Text Heading */}
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                        Terima Kasih!
                    </h1>

                    <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-sm mx-auto">
                        {message || (
                            <>
                                Pendaftaran Anda {branch ? <span>di <strong>IELC {branch.name}</strong></span> : 'ke IELC'} telah berhasil kami terima.
                                Tim Frontdesk kami akan segera menghubungi Anda melalui WhatsApp!
                            </>
                        )}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => router.visit(route('public.join.form'))}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-600/25 transition-all cursor-pointer hover:shadow-xl hover:scale-105 active:scale-95"
                        >
                            <span>Kembali ke Formulir</span>
                            <ArrowRight size={16} />
                        </button>

                        <a
                            href="https://ielc.co.id/"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
                        >
                            <span>Ke Website Utama</span>
                        </a>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 pt-6 border-t border-gray-100 text-[11px] text-gray-400 font-medium">
                        IELC English Campus Management System &copy; {new Date().getFullYear()}
                    </div>
                </div>
            </div>
        </>
    );
}
