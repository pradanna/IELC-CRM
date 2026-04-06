import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, label, processing }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={22} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900">Hapus item ini?</p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Tindakan ini tidak bisa dibatalkan.</p>
                        </div>
                    </div>

                    {label && (
                        <div className="p-4 bg-slate-50 rounded-2xl mb-6 text-center">
                            <p className="text-xs font-bold text-slate-600">{label}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={processing}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-red-600/20"
                        >
                            {processing && <Loader2 size={13} className="animate-spin" />}
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
