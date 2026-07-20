import React from 'react';
import Modal from '@/Components/ui/Modal';
import SecondaryButton from '@/Components/form/SecondaryButton';
import PrimaryButton from '@/Components/form/PrimaryButton';
import { FileText, Calendar, User, BookOpen, CircleDollarSign, CheckCircle2, X } from 'lucide-react';

export default function InvoiceDetailModal({ isOpen, onClose, invoice, onPay }) {
    if (!invoice) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled':
                return 'bg-slate-100 text-slate-600 border-slate-200';
            default:
                return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    // Calculate Subtotal (sum of item amounts before discount)
    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="bg-white rounded-3xl overflow-hidden relative">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <FileText size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Transaksi</span>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{invoice.invoice_number}</h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Status & Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Invoice</span>
                            <div className="pt-0.5">
                                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusStyle(invoice.status)}`}>
                                    {invoice.status}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tanggal Dibuat</span>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tipe Tagihan</span>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                {invoice.student_id ? 'Rejoin Class' : 'New Registration'}
                            </p>
                        </div>
                    </div>

                    {/* Customer & Class Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <User size={12} />
                                Informasi Pelanggan
                            </h4>
                            <div className="space-y-1 bg-white border border-slate-100 p-4 rounded-2xl">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    {invoice.lead?.name || invoice.student?.lead?.name || 'Unknown'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400">{invoice.lead?.phone || invoice.student?.lead?.phone || '-'}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{invoice.lead?.email || invoice.student?.lead?.email || '-'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <BookOpen size={12} />
                                Informasi Kelas
                            </h4>
                            <div className="space-y-1 bg-white border border-slate-100 p-4 rounded-2xl">
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                    {invoice.study_class?.name || <span className="text-slate-400 italic">Manual items only</span>}
                                </p>
                                {invoice.study_class && (
                                     <>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cabang: {invoice.study_class.branch?.name}</p>
                                         <p className="text-[10px] text-slate-400 font-medium">{invoice.session_count} Sesi Belajar</p>
                                         {invoice.start_date && (
                                             <p className="text-[10px] text-red-600 font-black uppercase tracking-wider mt-1">
                                                 Mulai Belajar: {new Date(invoice.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                             </p>
                                         )}
                                     </>
                                 )}
                            </div>
                        </div>
                    </div>

                    {/* Itemized List */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Tagihan</h4>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Item</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Harga Unit</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Jumlah</th>
                                        <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-5 py-4 font-bold text-slate-700 uppercase tracking-tight">{item.name}</td>
                                                <td className="px-5 py-4 text-right font-bold text-slate-600">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-5 py-4 text-center font-bold text-slate-500">{item.quantity}</td>
                                                <td className="px-5 py-4 text-right font-black text-slate-800">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-5 py-6 text-center text-slate-400 italic">Tidak ada item tagihan</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-4 border-t border-slate-100">
                        {/* Notes */}
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Catatan / Keterangan</span>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-line uppercase tracking-tight">
                                {invoice.notes || 'TIDAK ADA CATATAN'}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="space-y-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 text-xs">
                            <div className="flex justify-between font-bold text-slate-500 uppercase tracking-wide">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {invoice.discount_amount > 0 && (
                                <div className="flex justify-between font-bold text-rose-500 uppercase tracking-wide">
                                    <span>Total Diskon</span>
                                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                                </div>
                            )}
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-slate-800 uppercase tracking-wider">Total Tagihan</span>
                                <span className="text-base font-black text-red-600">{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <SecondaryButton onClick={onClose} className="rounded-xl">
                        Tutup
                    </SecondaryButton>

                    {invoice.status === 'pending' && (
                        <PrimaryButton 
                            onClick={() => {
                                onPay(invoice.id);
                                onClose();
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/10"
                        >
                            <CheckCircle2 size={16} className="mr-2" />
                            Terima Pembayaran
                        </PrimaryButton>
                    )}
                </div>
            </div>
        </Modal>
    );
}
