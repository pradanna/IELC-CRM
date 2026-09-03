import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import PremiumFormGroup from '@/Components/PremiumFormGroup';
import TextInput from '@/Components/form/TextInput';
import UpdatePasswordModal from './Partials/UpdatePasswordModal';
import { User, Mail, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name || '',
        email: user.email || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <AdminLayout>
            <Head title="Profil Saya" />

            <AdminPageLayout
                title="Profil Saya"
                subtitle="Kelola informasi akun dan pengaturan keamanan kata sandi Anda."
            >
                <div className="max-w-4xl space-y-8">
                    {/* User Summary Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-600 font-black text-2xl flex items-center justify-center border-2 border-red-100 shadow-sm">
                                {user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">{user.name}</h2>
                                <p className="text-sm font-medium text-slate-500">{user.email}</p>
                                <div className="pt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                                        <ShieldCheck size={14} className="text-red-500" />
                                        {user.roles?.[0]?.name || user.role || 'Pengguna'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Password Action */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-full font-bold text-sm shadow-sm transition-all active:scale-95 shrink-0"
                            >
                                <Key size={18} className="text-red-500" />
                                Ubah Password
                            </button>
                        </div>
                    </div>

                    {/* Profile Information Form */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                        <div className="border-b border-slate-100 pb-5">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <User size={20} className="text-red-500" />
                                Informasi Akun
                            </h3>
                            <p className="text-xs font-medium text-slate-400 mt-1">
                                Perbarui nama dan alamat email terdaftar akun Anda.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-6 max-w-2xl">
                            <PremiumFormGroup label="Nama Lengkap" error={errors.name} required>
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                            </PremiumFormGroup>

                            <PremiumFormGroup label="Alamat Email" error={errors.email} required>
                                <TextInput
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </PremiumFormGroup>

                            <div className="pt-2 flex items-center gap-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 rounded-full transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>

                                {recentlySuccessful && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                        <CheckCircle2 size={14} /> Berhasil disimpan
                                    </span>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Password Change Modal */}
                <UpdatePasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                />
            </AdminPageLayout>
        </AdminLayout>
    );
}
