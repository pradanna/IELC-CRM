import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export default function DeleteLeadModal({ isOpen, onClose, lead }) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        if (!lead) return;
        destroy(route('admin.crm.leads.destroy', lead.id), {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-8 pt-8 pb-6 flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle size={24} className="text-red-500" />
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-lg font-black text-slate-900">
                                            Hapus Lead?
                                        </Dialog.Title>
                                        <p className="text-xs font-medium text-slate-400 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-8 pb-8">
                                <div className="p-5 bg-slate-50 rounded-2xl mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead yang akan dihapus</p>
                                    <p className="text-sm font-black text-slate-900">{lead?.name}</p>
                                    <p className="text-xs font-medium text-slate-400 mt-0.5">{lead?.lead_number} • {lead?.phone}</p>
                                </div>

                                <p className="text-sm text-slate-600 font-medium mb-6 leading-relaxed">
                                    Data lead beserta seluruh riwayat aktivitasnya akan dihapus secara permanen dan tidak bisa dikembalikan.
                                </p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        disabled={processing}
                                        className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={processing}
                                        className="flex-1 px-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
                                    >
                                        {processing ? (
                                            <><Loader2 size={14} className="animate-spin" /> Menghapus...</>
                                        ) : (
                                            'Ya, Hapus Lead'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
