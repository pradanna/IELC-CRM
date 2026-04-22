import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Phone, CheckCircle2, XCircle, RefreshCcw, LogOut, QrCode, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Index({ branches }) {
    return (
        <AuthenticatedLayout>
            <Head title="WhatsApp Management" />

            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Page Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">System Configuration</p>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">WhatsApp Management</h1>
                    </div>
                </div>

                {/* Branch Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map((branch) => (
                        <BranchWaCard key={branch.id} branch={branch} />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function BranchWaCard({ branch }) {
    const [status, setStatus] = useState('loading');
    const [qrImage, setQrImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(route('admin.whatsapp.status', branch.code));
            if (res.data.status === 'connected') {
                setStatus('connected');
                setQrImage(null);
            } else if (res.data.status === 'waiting_for_scan') {
                setStatus('disconnected');
                setQrImage(res.data.qr_image_url);
            } else {
                setStatus('initializing');
                setQrImage(null);
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setError("Gagal menghubungi Gateway.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm(`Apakah Anda yakin ingin menghapus sesi WhatsApp untuk branch ${branch.name}? Sesi akan terputus dan data lokal di gateway akan dihapus.`)) return;

        setLoading(true);
        try {
            await axios.delete(route('admin.whatsapp.logout', branch.code));
            setStatus('disconnected');
            setQrImage(null);
            checkStatus(); // Refresh to get new QR
        } catch (err) {
            alert("Gagal melakukan logout.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(() => {
            if (status !== 'connected') checkStatus();
        }, 15000); // Polling every 15s if not connected

        return () => clearInterval(interval);
    }, [branch.code, status]);

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:shadow-slate-200/50">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 
                            status === 'loading' ? 'bg-slate-50 text-slate-400' : 'bg-red-50 text-red-600'
                        }`}>
                            <Phone size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm">{branch.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {status === 'connected' ? (
                                    <>
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Connected</span>
                                    </>
                                ) : status === 'loading' ? (
                                    <>
                                        <Loader2 size={12} className="text-slate-400 animate-spin" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Checking...</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={12} className="text-red-500" />
                                        <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">Disconnected</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={checkStatus}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
                    >
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* QR Section */}
                <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-dashed border-slate-200">
                    {qrImage ? (
                        <div className="p-4 bg-white rounded-2xl shadow-sm">
                            <img src={qrImage} alt="QR Code" className="w-full aspect-square" />
                        </div>
                    ) : status === 'connected' ? (
                        <div className="flex flex-col items-center gap-3 text-center p-6">
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">Sesi Aktif</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest px-4">WhatsApp Branch {branch.name} siap digunakan.</p>
                            </div>
                        </div>
                    ) : status === 'initializing' ? (
                        <div className="flex flex-col items-center gap-3 text-center p-6">
                            <Loader2 size={32} className="text-slate-400 animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Memulai Sesi...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 text-center p-6">
                            <QrCode size={48} className="text-slate-200" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">QR Code akan muncul di sini</p>
                        </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <Loader2 size={24} className="text-slate-900 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-3">
                    {status === 'connected' && (
                        <button 
                            onClick={handleLogout}
                            disabled={loading}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <LogOut size={16} />
                            Logout Sesi
                        </button>
                    ) || (
                        <button 
                            onClick={checkStatus}
                            disabled={loading}
                            className="flex-1 bg-slate-900 hover:bg-black text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
                        >
                            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                            Cek Koneksi / QR
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-500 text-white px-4 py-2 text-[10px] font-bold text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
