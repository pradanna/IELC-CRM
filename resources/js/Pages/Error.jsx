import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { RefreshCw, Home, ArrowLeft, AlertCircle, FileQuestion, ShieldAlert, WifiOff } from 'lucide-react';

export default function ErrorPage({ status = 404, message }) {
    const logoUrl = "/assets/images/local/logo-full.png";

    const errorDetails = {
        404: {
            title: 'Halaman Tidak Ditemukan',
            subtitle: 'Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan salah.',
            icon: <FileQuestion className="w-16 h-16 text-amber-500 animate-bounce" />,
            badge: '404 - Not Found',
            badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
            showReload: false,
            showHome: true,
        },
        419: {
            title: 'Sesi Halaman Telah Berakhir',
            subtitle: 'Sesi keamanan Anda telah kedaluwarsa atau token halaman telah usang karena lama tidak aktif.',
            icon: <RefreshCw className="w-16 h-16 text-red-500 animate-spin" style={{ animationDuration: '8s' }} />,
            badge: '419 - Session Expired',
            badgeColor: 'bg-red-50 text-red-600 border-red-200',
            showReload: true,
            showHome: true,
            reloadInstruction: 'Silakan muat ulang (reload) halaman ini untuk memperbarui sesi login Anda.',
        },
        403: {
            title: 'Akses Ditolak',
            subtitle: 'Anda tidak memiliki izin atau wewenang untuk mengakses halaman atau data ini.',
            icon: <ShieldAlert className="w-16 h-16 text-rose-500" />,
            badge: '403 - Forbidden',
            badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
            showReload: false,
            showHome: true,
        },
        500: {
            title: 'Terjadi Gangguan Server',
            subtitle: 'Terjadi kesalahan internal pada server kami. Tim teknis sedang menanganinya.',
            icon: <AlertCircle className="w-16 h-16 text-red-500" />,
            badge: '500 - Server Error',
            badgeColor: 'bg-red-50 text-red-600 border-red-200',
            showReload: true,
            showHome: true,
            reloadInstruction: 'Coba muat ulang halaman beberapa saat lagi.',
        },
        503: {
            title: 'Layanan Dalam Pemeliharaan',
            subtitle: 'Sistem sedang dalam proses pemeliharaan rutin. Kami akan segera kembali.',
            icon: <WifiOff className="w-16 h-16 text-indigo-500" />,
            badge: '503 - Service Unavailable',
            badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            showReload: true,
            showHome: false,
            reloadInstruction: 'Muat ulang berkala untuk memeriksa kesiapan server.',
        },
    };

    const current = errorDetails[status] || errorDetails[404];

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <>
            <Head title={`${status} - ${current.title}`} />
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black p-4 relative overflow-hidden font-sans select-none">
                {/* Decorative background glow circles */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Main Card */}
                <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-8 sm:p-12 text-center transition-all">
                    {/* Brand Logo */}
                    <div className="flex justify-center mb-6">
                        <img 
                            src={logoUrl} 
                            alt="IELC Logo" 
                            className="h-14 sm:h-16 w-auto object-contain hover:scale-105 transition-transform duration-300"
                        />
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border mb-6 shadow-2xs">
                        <span className={`inline-block w-2 h-2 rounded-full ${status === 419 || status === 500 ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`}></span>
                        <span className={current.badgeColor.split(' ')[1]}>{current.badge}</span>
                    </div>

                    {/* Icon Illustration */}
                    <div className="flex justify-center mb-5">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl shadow-inner">
                            {current.icon}
                        </div>
                    </div>

                    {/* Text Heading */}
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">
                        {current.title}
                    </h1>

                    <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
                        {message || current.subtitle}
                    </p>

                    {/* Expired / Reload Specific Alert Box */}
                    {current.reloadInstruction && (
                        <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-center gap-2.5 text-xs font-semibold text-amber-800 animate-pulse">
                            <RefreshCw size={15} className="text-amber-600 shrink-0" />
                            <span>{current.reloadInstruction}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        {current.showReload && (
                            <button
                                type="button"
                                onClick={handleReload}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-600/25 transition-all cursor-pointer hover:shadow-xl"
                            >
                                <RefreshCw size={16} />
                                <span>Muat Ulang Halaman</span>
                            </button>
                        )}

                        {current.showHome && (
                            <Link
                                href="/"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-bold rounded-2xl transition-all"
                            >
                                <Home size={16} />
                                <span>Kembali ke Beranda</span>
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 text-gray-400 hover:text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            <ArrowLeft size={14} />
                            <span>Kembali Sebelumnya</span>
                        </button>
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
