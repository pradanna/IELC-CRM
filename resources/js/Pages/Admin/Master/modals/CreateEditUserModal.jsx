import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { X, User, Mail, Lock, Shield, Building2, Phone, MapPin, Loader2 } from 'lucide-react';
import PremiumFormGroup from '@/Components/PremiumFormGroup';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function CreateEditUserModal({ isOpen, onClose, user = null, roles = [], branches = [] }) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: 'passwordielc',
        password_confirmation: 'passwordielc',
        role: '',
        branch_id: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        if (user) {
            setData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                password_confirmation: '',
                role: user.role || '',
                branch_id: user.branch_id || '',
                phone: user.phone || '',
                address: user.address || '',
            });
        } else {
            setData({
                name: '',
                email: '',
                password: 'passwordielc',
                password_confirmation: 'passwordielc',
                role: '',
                branch_id: '',
                phone: '',
                address: '',
            });
        }
        clearErrors();
    }, [user, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (user) {
            put(route('admin.master.users.update', user.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route('admin.master.users.store'), {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                <div className="absolute right-8 top-8">
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all outline-none"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                    {/* Modal Header */}
                                    <div>
                                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-4 border border-red-100">
                                            <User size={28} />
                                        </div>
                                        <Dialog.Title as="h3" className="text-2xl font-black text-slate-900 tracking-tight">
                                            {user ? 'Edit User Account' : 'Create New staff Account'}
                                        </Dialog.Title>
                                        <p className="text-sm font-bold text-slate-400 mt-1">
                                            {user ? 'Perbarui informasi akun staff.' : 'Tambahkan anggota staff baru ke sistem.'}
                                        </p>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Name */}
                                        <div className="md:col-span-2">
                                            <PremiumFormGroup label="Full Name" error={errors.name} required>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="text"
                                                        value={data.name}
                                                        onChange={e => setData('name', e.target.value)}
                                                        className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-red-500/5 transition-all ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                                                        placeholder="e.g. John Doe"
                                                    />
                                                </div>
                                            </PremiumFormGroup>
                                        </div>

                                        {/* Email */}
                                        <PremiumFormGroup label="Email Address" error={errors.email} required>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="email"
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                    className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-red-500/5 transition-all ${errors.email ? 'ring-2 ring-red-500' : ''}`}
                                                    placeholder="john@ielc.co.id"
                                                />
                                            </div>
                                        </PremiumFormGroup>

                                        {/* Role */}
                                        <PremiumFormGroup label="Assigned Role" error={errors.role} required>
                                            <div className="relative group">
                                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <select
                                                    value={data.role}
                                                    onChange={e => setData('role', e.target.value)}
                                                    className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-red-500/5 transition-all appearance-none ${errors.role ? 'ring-2 ring-red-500' : ''}`}
                                                >
                                                    <option value="">Select Role</option>
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.name}>{r.name.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </PremiumFormGroup>

                                        {/* Password */}
                                        <PremiumFormGroup 
                                            label={user ? 'New Password (Optional)' : 'Password'} 
                                            error={errors.password}
                                            required={!user}
                                        >
                                            {!user && (
                                                <div className="mb-2">
                                                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight bg-red-50 px-2 py-0.5 rounded-md">
                                                        Default: passwordielc
                                                    </span>
                                                </div>
                                            )}
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="password"
                                                    value={data.password}
                                                    onChange={e => setData('password', e.target.value)}
                                                    className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-red-500/5 transition-all ${errors.password ? 'ring-2 ring-red-500' : ''}`}
                                                />
                                            </div>
                                        </PremiumFormGroup>

                                        {/* Confirmation */}
                                        <PremiumFormGroup label="Confirm Password">
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="password"
                                                    value={data.password_confirmation}
                                                    onChange={e => setData('password_confirmation', e.target.value)}
                                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-red-500/5 transition-all"
                                                />
                                            </div>
                                        </PremiumFormGroup>

                                        {/* Branch */}
                                        <PremiumFormGroup label="Primary Branch" error={errors.branch_id} required>
                                            <div className="relative group">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <select
                                                    value={data.branch_id}
                                                    onChange={e => setData('branch_id', e.target.value)}
                                                    className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 focus:ring-red-500/5 transition-all appearance-none ${errors.branch_id ? 'ring-2 ring-red-500' : ''}`}
                                                >
                                                    <option value="">Select Branch</option>
                                                    {branches.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </PremiumFormGroup>

                                        {/* Phone */}
                                        <PremiumFormGroup label="Phone Number" error={errors.phone}>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    value={data.phone}
                                                    onChange={e => setData('phone', e.target.value)}
                                                    className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-red-500/5 transition-all ${errors.phone ? 'ring-2 ring-red-500' : ''}`}
                                                    placeholder="0812..."
                                                />
                                            </div>
                                        </PremiumFormGroup>

                                        {/* Address */}
                                        <div className="md:col-span-2">
                                            <PremiumFormGroup label="Residence Address" error={errors.address}>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                                                    <textarea
                                                        value={data.address}
                                                        onChange={e => setData('address', e.target.value)}
                                                        rows={3}
                                                        className={`w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-red-500/5 transition-all resize-none ${errors.address ? 'ring-2 ring-red-500' : ''}`}
                                                        placeholder="Alamat lengkap staff..."
                                                    />
                                                </div>
                                            </PremiumFormGroup>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-6 flex gap-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/10 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={16} />
                                                    Processing...
                                                </>
                                            ) : (
                                                user ? 'Update Account' : 'Create Account'
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
