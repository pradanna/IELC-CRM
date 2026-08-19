import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';
import SecondaryButton from '@/Components/form/SecondaryButton';
import PrimaryButton from '@/Components/form/PrimaryButton';
import { FileText, Calendar, User, BookOpen, CircleDollarSign, CheckCircle2, X, Copy, Check, Send, ExternalLink, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

export default function InvoiceDetailModal({ isOpen, onClose, invoice, onPay }) {
    if (!invoice) return null;

    const [copied, setCopied] = useState(false);
    const [sendingWa, setSendingWa] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const magicUrl = `${window.location.origin}/invoice/${invoice.id}`;

    const copyLink = () => {
        navigator.clipboard.writeText(magicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openInvoice = () => {
        window.open(magicUrl, '_blank');
    };

    const cancelInvoice = () => {
        if (confirm(`Batalkan invoice ${invoice.invoice_number}? Tindakan ini tidak dapat diurungkan.`)) {
            router.post(route('admin.finance.invoices.cancel', invoice.id), {}, {
                onSuccess: () => onClose(),
            });
        }
    };

    const sendWhatsAppMagicLink = async () => {
        const customerName = invoice.lead?.name || invoice.student?.lead?.name || 'Siswa';
        const rawPhone = invoice.lead?.phone || invoice.student?.lead?.phone || '';
        if (!rawPhone) {
            alert('Nomor WhatsApp tidak tersedia untuk invoice ini.');
            return;
        }

        let phone = rawPhone.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
        } else if (!phone.startsWith('62')) {
            phone = '62' + phone;
        }

        const branchCode = (
            invoice.study_class?.branch?.code ||
            invoice.lead?.branch?.code ||
            invoice.student?.lead?.branch?.code ||
            'solo'
        ).toLowerCase();

        let typeLabel = 'pendaftaran';
        if (invoice.type === 'placement_test') {
            typeLabel = 'placement test';
        } else if (invoice.type === 'rejoin') {
            typeLabel = 'rejoin';
        } else if (invoice.type === 'paket_lanjut') {
            typeLabel = 'paket lanjut';
        }

        const dueDateFmt = invoice.due_date
            ? new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';

        const isPaid = invoice.status === 'paid';
        let message = `Halo *${customerName}*,\n\n`;
        if (isPaid) {
            message += `Berikut adalah bukti pembayaran ${typeLabel} Anda dari Interactive English Language Center (IELC):\n\n📄 *Nomor Invoice*: ${invoice.invoice_number}\n💰 *Total Terbayar*: ${formatCurrency(invoice.total_amount)}\n\nSilakan klik link berikut untuk melihat / mengunduh bukti pembayaran Anda:\n🔗 ${magicUrl}\n\nTerima kasih! 🙏`;
        } else {
            message += `Berikut adalah tagihan ${typeLabel} Anda dari Interactive English Language Center (IELC):\n\n📄 *Nomor Invoice*: ${invoice.invoice_number}\n💰 *Total Tagihan*: ${formatCurrency(invoice.total_amount)}\n📅 *Jatuh Tempo*: ${dueDateFmt}\n\nSilakan klik link berikut untuk melihat / mengunduh invoice Anda:\n🔗 ${magicUrl}\n\nSilakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih! 🙏`;
        }

        if (!confirm(`Kirim invoice ke ${customerName} (${phone}) via WhatsApp?`)) return;

        setSendingWa(true);
        try {
            await axios.post(route('admin.whatsapp.send'), {
                branch: branchCode,
                phone: phone,
                message: message,
            });
            alert(`Invoice berhasil dikirim ke ${customerName} via WhatsApp!`);
        } catch (error) {
            console.error('Error sending WA:', error);
            alert('Gagal mengirim WhatsApp: ' + (error.response?.data?.error || error.response?.data?.message || 'Server error'));
        } finally {
            setSendingWa(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'paid': return 'LUNAS';
            case 'cancelled': return 'DIBATALKAN';
            default: return 'PENDING';
        }
    };

    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
            <div className="bg-white rounded-3xl overflow-hidden relative">
                {/* Header */}
                <div className="px-10 py-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                            <FileText size={26} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Detail Transaksi</span>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{invoice.invoice_number}</h3>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="px-10 py-8 space-y-8 max-h-[72vh] overflow-y-auto">
                    {/* Status & Dates */}
                    <div className={`grid grid-cols-1 ${invoice.status === 'paid' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100`}>
                        <div className="space-y-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Status Invoice</span>
                            <div className="pt-0.5">
                                <span className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider ${getStatusStyle(invoice.status)}`}>
                                    {getStatusLabel(invoice.status)}
                                </span>
                            </div>
                        </div>
                        {invoice.status === 'paid' && (
                            <div className="space-y-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Metode Pembayaran</span>
                                <p className="text-sm font-black text-emerald-700 uppercase tracking-tight">
                                    {invoice.payment_method || '-'}
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tanggal Dibuat</span>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Jatuh Tempo</span>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Customer & Class Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={14} />
                                Informasi Pelanggan
                            </h4>
                            <div className="space-y-2 bg-white border border-slate-100 p-5 rounded-2xl">
                                <p className="text-base font-black text-slate-800 uppercase tracking-tight">
                                    {invoice.lead?.name || invoice.student?.lead?.name || 'Unknown'}
                                </p>
                                <p className="text-sm font-bold text-slate-500">{invoice.lead?.phone || invoice.student?.lead?.phone || '-'}</p>
                                <p className="text-sm text-slate-400 font-medium truncate">{invoice.lead?.email || invoice.student?.lead?.email || '-'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={14} />
                                Informasi Kelas
                            </h4>
                            <div className="space-y-2 bg-white border border-slate-100 p-5 rounded-2xl">
                                <p className="text-base font-black text-slate-800 uppercase tracking-tight">
                                    {invoice.study_class?.name || <span className="text-slate-400 italic font-medium">Manual items only</span>}
                                </p>
                                {invoice.study_class && (
                                    <>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Cabang: {invoice.study_class.branch?.name}</p>
                                        <p className="text-sm text-slate-500 font-medium">{invoice.session_count} Sesi Belajar</p>
                                        {(invoice.start_date || invoice.study_class?.start_session_date) && (
                                            <p className="text-sm text-red-600 font-black uppercase tracking-wider mt-1">
                                                Periode Belajar: {new Date(invoice.start_date || invoice.study_class.start_session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {(invoice.end_date || invoice.study_class?.end_session_date) ? ` s/d ${new Date(invoice.end_date || invoice.study_class.end_session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                            </p>
                                        )}
                                        {invoice.student && (
                                            <p className="text-sm text-emerald-600 font-black uppercase tracking-wider">
                                                Paket Diselesaikan: {invoice.student.rejoin_count || 0} Paket
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Itemized List */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Daftar Tagihan</h4>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Deskripsi Item</th>
                                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Harga Unit</th>
                                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Jml</th>
                                        <th className="px-5 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items && invoice.items.length > 0 ? (
                                        invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-5 py-4 text-sm font-bold text-slate-700 uppercase tracking-tight">{item.name}</td>
                                                <td className="px-5 py-4 text-sm text-right font-bold text-slate-600">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-5 py-4 text-sm text-center font-bold text-slate-500">{item.quantity}</td>
                                                <td className="px-5 py-4 text-sm text-right font-black text-slate-800">{formatCurrency(item.subtotal)}</td>
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
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={13} className="text-slate-400" />
                                    Catatan Internal
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    Internal Only (Sembunyi di PDF Customer)
                                </span>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm text-slate-800 font-bold leading-relaxed whitespace-pre-line">
                                {invoice.notes || <span className="text-slate-400 italic font-normal">Tidak ada catatan internal</span>}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="space-y-3 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                            <div className="flex justify-between font-bold text-slate-500 uppercase tracking-wide text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {invoice.discount_amount > 0 && (() => {
                                const lines = (invoice.discount_breakdown || '')
                                    .split('\n')
                                    .map(l => l.trim())
                                    .filter(l => l.length > 0);

                                if (lines.length > 0) {
                                    return lines.map((line, idx) => {
                                        const colonIdx = line.indexOf(':');
                                        const label = colonIdx >= 0 ? line.substring(0, colonIdx).trim() : line;
                                        const val   = colonIdx >= 0 ? line.substring(colonIdx + 1).trim() : '';
                                        return (
                                            <div key={idx} className="flex justify-between font-bold text-rose-500 uppercase tracking-wide text-sm">
                                                <span>{label}</span>
                                                <span>-{val || formatCurrency(invoice.discount_amount)}</span>
                                            </div>
                                        );
                                    });
                                }

                                // fallback if no breakdown lines
                                return (
                                    <div className="flex justify-between font-bold text-rose-500 uppercase tracking-wide text-sm">
                                        <span>Total Diskon</span>
                                        <span>-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                );
                            })()}
                            <div className="h-px bg-slate-200 my-1"></div>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-slate-800 uppercase tracking-wider text-sm">Total Tagihan</span>
                                <span className="text-xl font-black text-red-600">{formatCurrency(invoice.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/60">
                    {/* Row 1: Utility actions */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button
                            type="button"
                            onClick={copyLink}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                            <span>{copied ? 'Link Tersalin!' : 'Copy Link Tagihan'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={openInvoice}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all"
                        >
                            <ExternalLink size={15} />
                            <span>Buka Invoice</span>
                        </button>

                        <button
                            type="button"
                            onClick={sendWhatsAppMagicLink}
                            disabled={sendingWa}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {sendingWa
                                ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" /><span>Mengirim...</span></>
                                : <><Send size={15} className="text-emerald-600" /><span>Kirim WA</span></>
                            }
                        </button>
                    </div>

                    {/* Row 2: Status-changing actions (only for pending) */}
                    {invoice.status === 'pending' && (
                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={cancelInvoice}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all"
                            >
                                <XCircle size={17} />
                                Batalkan Invoice
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    onPay(invoice);
                                    onClose();
                                }}
                                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
                            >
                                <CheckCircle2 size={18} />
                                Terima Pembayaran
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
