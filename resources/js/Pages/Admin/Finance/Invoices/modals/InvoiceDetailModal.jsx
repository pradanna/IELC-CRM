import React, { useState } from 'react';
import Modal from '@/Components/ui/Modal';
import { 
    FileText, 
    Calendar, 
    User, 
    BookOpen, 
    CheckCircle2, 
    X, 
    Copy, 
    Check, 
    Send, 
    ExternalLink, 
    XCircle,
    Clock,
    CreditCard
} from 'lucide-react';
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
        }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatShortDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const date = d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${date}, ${hours}:${minutes} WIB`;
        } catch {
            return dateStr;
        }
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

        const dueDateFmt = invoice.due_date ? formatDate(invoice.due_date) : '-';

        const isPaid = invoice.status === 'paid';
        let message = `Halo *${customerName}*,\n\n`;
        if (isPaid) {
            message += `Berikut adalah bukti pembayaran ${typeLabel} Anda dari Interactive English Language Center (IELC):\n\nNomor Invoice: ${invoice.invoice_number}\nTotal Terbayar: ${formatCurrency(invoice.total_amount)}\n\nSilakan klik link berikut untuk melihat / mengunduh bukti pembayaran Anda:\n${magicUrl}\n\nTerima kasih!`;
        } else {
            message += `Berikut adalah tagihan ${typeLabel} Anda dari Interactive English Language Center (IELC):\n\nNomor Invoice: ${invoice.invoice_number}\nTotal Tagihan: ${formatCurrency(invoice.total_amount)}\nJatuh Tempo: ${dueDateFmt}\n\nSilakan klik link berikut untuk melihat / mengunduh invoice Anda:\n${magicUrl}\n\nSilakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih!`;
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
                return 'bg-rose-50 text-rose-700 border-rose-200';
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
        <Modal show={isOpen} onClose={onClose} maxWidth="7xl">
            <div className="bg-white rounded-[32px] overflow-hidden relative flex flex-col max-h-[94vh]">
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 shadow-xs">
                            <FileText size={24} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block leading-none mb-1.5">
                                Detail Transaksi
                            </span>
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                    {invoice.invoice_number}
                                </h3>
                                <span className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${getStatusStyle(invoice.status)}`}>
                                    {getStatusLabel(invoice.status)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-all cursor-pointer"
                        title="Tutup"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Body Content: Spacious 2-Column Layout */}
                <div className="p-7 sm:p-8 flex-1 overflow-y-auto sm:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
                    {/* LEFT COLUMN: Payment Status, Customer & Class Info, Notes (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* 1. Payment Information (Prominent when paid, clean status when pending) */}
                        {invoice.status === 'paid' ? (
                            <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-widest text-emerald-800 block leading-none">
                                                Informasi Pembayaran
                                            </span>
                                            <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                                                Lunas / Terverifikasi
                                            </span>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-300/60">
                                        PAID
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-emerald-200/70">
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Metode Bayar</span>
                                        <span className="font-black text-slate-900 uppercase tracking-tight text-sm">
                                            {invoice.payment_method || 'CASH / TUNAI'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Waktu Bayar</span>
                                        <span className="font-black text-slate-900 tracking-tight text-sm">
                                            {formatDateTime(invoice.paid_at || invoice.updated_at)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Tgl Dibuat</span>
                                        <span className="font-bold text-slate-700 text-sm">
                                            {formatDate(invoice.created_at)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Total Terbayar</span>
                                        <span className="font-black text-emerald-700 text-base">
                                            {formatCurrency(invoice.total_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${invoice.status === 'cancelled' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-amber-500 shadow-amber-500/20'} shadow-sm`}>
                                            {invoice.status === 'cancelled' ? <XCircle size={20} /> : <Clock size={20} />}
                                        </div>
                                        <div>
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block leading-none">
                                                Status Tagihan
                                            </span>
                                            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                                                {getStatusLabel(invoice.status)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusStyle(invoice.status)}`}>
                                        {getStatusLabel(invoice.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-slate-200/60">
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Tanggal Dibuat</span>
                                        <span className="font-bold text-slate-800 text-sm">
                                            {formatDate(invoice.created_at)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Jatuh Tempo</span>
                                        <span className="font-bold text-slate-800 text-sm">
                                            {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-200/60 text-xs space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                        Rekening Transfer Pembayaran:
                                    </span>
                                    <div className="font-mono text-xs font-bold text-slate-700 flex flex-wrap gap-x-3 gap-y-1">
                                        <span>BCA: <strong className="text-slate-900">7850 418 211</strong></span>
                                        <span>BNI: <strong className="text-slate-900">027 5277 683</strong></span>
                                        <span>MANDIRI: <strong className="text-slate-900">138-000-011-2214</strong></span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 block">
                                        a/n PT. Lingua Munda
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 2. Customer & Class Information (2 Cards side by side) */}
                        <div className="grid grid-cols-2 gap-3.5">
                            {/* Pelanggan */}
                            <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl space-y-1.5">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <User size={14} className="text-slate-400" />
                                    Pelanggan
                                </span>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate" title={invoice.lead?.name || invoice.student?.lead?.name}>
                                    {invoice.lead?.name || invoice.student?.lead?.name || 'Unknown'}
                                </p>
                                <p className="text-xs font-bold text-slate-600">{invoice.lead?.phone || invoice.student?.lead?.phone || '-'}</p>
                                <p className="text-xs text-slate-400 truncate">{invoice.lead?.email || invoice.student?.lead?.email || '-'}</p>
                            </div>

                            {/* Kelas */}
                            <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl space-y-1.5">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <BookOpen size={14} className="text-slate-400" />
                                    Kelas
                                </span>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate" title={invoice.study_class?.name || 'Manual Item'}>
                                    {invoice.study_class?.name || 'Manual Item'}
                                </p>
                                {invoice.study_class ? (
                                    <>
                                        <p className="text-xs font-bold text-slate-600 uppercase truncate">Cabang: {invoice.study_class.branch?.name || '-'}</p>
                                        <p className="text-xs text-slate-500 font-medium">{invoice.session_count} Sesi Belajar</p>
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Non-kelas</p>
                                )}
                            </div>
                        </div>

                        {/* Periode Belajar / Rejoin badge */}
                        {(invoice.start_date || invoice.study_class?.start_session_date) && (
                            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-500 uppercase tracking-wider">Periode Belajar:</span>
                                <span className="font-black text-red-600 uppercase">
                                    {formatShortDate(invoice.start_date || invoice.study_class.start_session_date)}
                                    {(invoice.end_date || invoice.study_class?.end_session_date) ? ` s/d ${formatShortDate(invoice.end_date || invoice.study_class.end_session_date)}` : ''}
                                </span>
                            </div>
                        )}

                        {/* 3. Catatan Internal */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={13} />
                                    Catatan Internal
                                </span>
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                                    Internal Only
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-semibold leading-relaxed max-h-20 overflow-y-auto whitespace-pre-line">
                                {invoice.notes || <span className="text-slate-400 italic font-normal">Tidak ada catatan internal</span>}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Daftar Tagihan & Ringkasan Total (7 cols) */}
                    <div className="lg:col-span-7 space-y-4 flex flex-col justify-between h-full">
                        {/* Itemized List Table */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                                    Rincian Item Tagihan
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                    {invoice.items?.length || 0} Item
                                </span>
                            </div>

                            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                                <div className="max-h-60 overflow-y-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 border-b border-slate-200/80">
                                            <tr className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                                <th className="px-5 py-3">Deskripsi Item</th>
                                                <th className="px-5 py-3 text-right">Harga Unit</th>
                                                <th className="px-4 py-3 text-center">Jml</th>
                                                <th className="px-5 py-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoice.items && invoice.items.length > 0 ? (
                                                invoice.items.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-3 font-bold text-slate-800 uppercase tracking-tight text-xs leading-snug">
                                                            {item.name}
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-bold text-slate-600 text-xs whitespace-nowrap">
                                                            {formatCurrency(item.unit_price)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-slate-500 text-xs whitespace-nowrap">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-5 py-3 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                                                            {formatCurrency(item.subtotal)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-5 py-6 text-center text-slate-400 italic text-xs">
                                                        Tidak ada item tagihan
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl space-y-2.5">
                            <div className="flex justify-between font-bold text-slate-500 uppercase tracking-wider text-xs">
                                <span>Subtotal</span>
                                <span className="text-slate-800 font-black text-sm">{formatCurrency(subtotal)}</span>
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
                                            <div key={idx} className="flex justify-between font-bold text-rose-500 uppercase tracking-wider text-xs">
                                                <span>{label}</span>
                                                <span className="font-black text-sm">-{val || formatCurrency(invoice.discount_amount)}</span>
                                            </div>
                                        );
                                    });
                                }

                                return (
                                    <div className="flex justify-between font-bold text-rose-500 uppercase tracking-wider text-xs">
                                        <span>Total Diskon</span>
                                        <span className="font-black text-sm">-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                );
                            })()}

                            <div className="h-px bg-slate-200 my-1"></div>

                            <div className="flex justify-between items-center pt-1">
                                <div>
                                    <span className="font-black text-slate-900 uppercase tracking-wider text-sm block">
                                        Total Tagihan
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        {invoice.status === 'paid' ? 'Lunas / Terbayar' : 'Menunggu Pembayaran'}
                                    </span>
                                </div>
                                <span className="text-3xl font-black text-red-600 tracking-tight">
                                    {formatCurrency(invoice.total_amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    {/* Left: Utility actions */}
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={copyLink}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                            <span>{copied ? 'Link Tersalin!' : 'Copy Link Tagihan'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={openInvoice}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                            <ExternalLink size={15} />
                            <span>Buka Invoice</span>
                        </button>

                        <button
                            type="button"
                            onClick={sendWhatsAppMagicLink}
                            disabled={sendingWa}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-xs disabled:opacity-60 cursor-pointer active:scale-95"
                        >
                            {sendingWa ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                                    <span>Mengirim...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={15} className="text-emerald-600" />
                                    <span>Kirim WA</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right: Status actions & Close */}
                    <div className="flex items-center gap-2.5">
                        {invoice.status === 'pending' && (
                            <>
                                <button
                                    type="button"
                                    onClick={cancelInvoice}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer active:scale-95"
                                >
                                    <XCircle size={16} />
                                    Batalkan
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        onPay(invoice);
                                        onClose();
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                                >
                                    <CheckCircle2 size={16} />
                                    Terima Pembayaran
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
