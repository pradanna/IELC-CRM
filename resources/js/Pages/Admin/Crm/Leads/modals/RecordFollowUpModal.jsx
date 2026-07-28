import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, PhoneCall, MessageSquare, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function RecordFollowUpModal({ isOpen: propIsOpen, onClose: propOnClose, lead: propLead, onSuccess }) {
    const [localIsOpen, setLocalIsOpen] = useState(false);
    const [localLead, setLocalLead] = useState(null);

    const isControlled = propIsOpen !== undefined;
    const isOpen = isControlled ? propIsOpen : localIsOpen;
    const lead = isControlled ? propLead : localLead;

    const [type, setType] = useState('phone');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onClose = () => {
        if (isControlled) {
            if (propOnClose) propOnClose();
        } else {
            setLocalIsOpen(false);
            setLocalLead(null);
        }
        setMessage('');
        setType('phone');
        setError(null);
    };

    useEffect(() => {
        if (isControlled) return;

        const handleOpen = (e) => {
            setLocalLead(e.detail.lead);
            if (e.detail.defaultType) setType(e.detail.defaultType);
            setLocalIsOpen(true);
        };
        document.addEventListener('openRecordFollowUpModal', handleOpen);
        return () => {
            document.removeEventListener('openRecordFollowUpModal', handleOpen);
        };
    }, [isControlled]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!lead || loading) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.patch(route('admin.crm.leads.record-followup', lead.id), {
                type,
                message: message.trim() || undefined
            });

            if (onSuccess) {
                onSuccess(response.data);
            }

            // Dispatch global event for drawer refresh if needed
            document.dispatchEvent(new CustomEvent('leadFollowUpRecorded', { detail: { leadId: lead.id } }));

            onClose();
        } catch (err) {
            console.error('Failed to record follow-up:', err);
            setError(err.response?.data?.message || 'Gagal mencatat follow-up.');
        } finally {
            setLoading(false);
        }
    };

    const channelTypes = [
        { id: 'phone', label: 'Panggilan Telepon', icon: PhoneCall, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { id: 'whatsapp', label: 'WhatsApp (Manual / HP)', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { id: 'sms', label: 'SMS', icon: Phone, color: 'text-purple-600 bg-purple-50 border-purple-200' },
        { id: 'offline_chat', label: 'Tatap Muka / Lokasi', icon: CheckCircle2, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    ];

    return (
        <Transition.Root show={!!isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[110]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8">
                            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                                        <PhoneCall size={24} />
                                    </div>
                                    <div>
                                        <Dialog.Title className="text-lg font-black text-slate-900">
                                            Catat Follow-Up Lead
                                        </Dialog.Title>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                            Lead: {lead?.name || '---'} (FUP saat ini: {lead?.follow_up_count ?? 0})
                                        </p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Metode / Kanal Follow-Up
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {channelTypes.map((item) => {
                                            const Icon = item.icon;
                                            const isSelected = type === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setType(item.id)}
                                                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                                        isSelected
                                                            ? `${item.color} font-black ring-2 ring-indigo-500/20 shadow-sm`
                                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                                                    }`}
                                                >
                                                    <Icon size={18} className="shrink-0" />
                                                    <span className="text-xs">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Catatan / Ringkasan Percakapan (Opsional)
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Contoh: Sudah ditelepon, prospek bersedia datang tes hari Sabtu..."
                                        className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-[2] py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                                    >
                                        {loading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        Simpan & Tambah FUP
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
