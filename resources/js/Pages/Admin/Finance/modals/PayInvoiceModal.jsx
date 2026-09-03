import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import { CreditCard, CheckCircle2, X } from 'lucide-react';

export default function PayInvoiceModal({ isOpen, onClose, onConfirm, invoiceNumber, totalAmount, paymentAccounts = [] }) {
    const defaultFallback = [
        'Cash / Tunai',
        'Bank BCA',
        'Bank Mandiri',
        'Bank BNI',
        'Bank BRI',
        'QRIS',
        'Mesin EDC / Kartu',
        'Lainnya',
    ];

    const availableMethods = paymentAccounts.length > 0 
        ? [...paymentAccounts.map(a => a.name), 'Lainnya']
        : defaultFallback;

    const [paymentMethod, setPaymentMethod] = useState(availableMethods[0] || 'Bank BCA');
    const [customMethod, setCustomMethod] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const formatCurrency = (amount) => {
        if (!amount) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const selected = paymentMethod === 'Lainnya' ? customMethod.trim() : paymentMethod;
        if (!selected) {
            alert('Silakan pilih atau masukkan metode pembayaran.');
            return;
        }

        setSubmitting(true);
        onConfirm(selected, () => {
            setSubmitting(false);
            onClose();
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="md">
            <div className="bg-white rounded-3xl overflow-hidden p-6 sm:p-8 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CreditCard size={22} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Konfirmasi Pembayaran</span>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                {invoiceNumber || 'Terima Pembayaran'}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {totalAmount !== undefined && (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total Tagihan</span>
                            <span className="text-lg font-black text-emerald-600">{formatCurrency(totalAmount)}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                            Pilih Metode Pembayaran <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {availableMethods.map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setPaymentMethod(method)}
                                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                                        paymentMethod === method
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{method}</span>
                                    {paymentMethod === method && <CheckCircle2 size={14} className="text-emerald-600 shrink-0 ml-1" />}
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'Lainnya' && (
                            <div className="mt-3">
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                    Metode Pembayaran Lainnya
                                </label>
                                <input
                                    type="text"
                                    value={customMethod}
                                    onChange={(e) => setCustomMethod(e.target.value)}
                                    placeholder="Contoh: GoPay, ShopeePay, dll"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <SecondaryButton type="button" onClick={onClose} disabled={submitting}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                            {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
