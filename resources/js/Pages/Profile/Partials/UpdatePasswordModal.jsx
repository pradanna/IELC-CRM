import React, { useState, useRef } from 'react';
import PremiumFormGroup from '@/Components/PremiumFormGroup';
import TextInput from '@/Components/form/TextInput';
import { useForm } from '@inertiajs/react';
import { Lock, X, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordModal({ isOpen, onClose }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    if (!isOpen) return null;

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setTimeout(() => {
                    onClose();
                }, 1000);
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    if (passwordInput.current) passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    if (currentPasswordInput.current) currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">Ubah Password</h3>
                            <p className="text-xs text-slate-400 font-medium">Perbarui kata sandi akun Anda secara aman.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={updatePassword} className="p-6 space-y-5">
                    <PremiumFormGroup label="Password Saat Ini" error={errors.current_password} required>
                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            type="password"
                            autoComplete="current-password"
                            required
                        />
                    </PremiumFormGroup>

                    <PremiumFormGroup label="Password Baru" error={errors.password} required>
                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            autoComplete="new-password"
                            required
                        />
                    </PremiumFormGroup>

                    <PremiumFormGroup label="Konfirmasi Password Baru" error={errors.password_confirmation} required>
                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            type="password"
                            autoComplete="new-password"
                            required
                        />
                    </PremiumFormGroup>

                    {/* Footer Actions */}
                    <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                        {recentlySuccessful ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                <CheckCircle2 size={14} /> Berhasil disimpan!
                            </span>
                        ) : (
                            <span></span>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-50 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 rounded-full transition-all active:scale-95 disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Password'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
