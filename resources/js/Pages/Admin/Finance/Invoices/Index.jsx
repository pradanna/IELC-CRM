import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Search, 
    Calendar, 
    Download, 
    CheckCircle, 
    Clock, 
    ArrowLeft, 
    Filter,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    FileText,
    MessageCircle,
    RotateCcw,
    Copy,
    XCircle,
    Edit2
} from 'lucide-react';
import Pagination from '@/Components/ui/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '@/Components/ui/Table';
import Button from '@/Components/ui/Button';
import SearchInput from '@/Components/ui/SearchInput';
import TextInput from '@/Components/TextInput';
import DatePicker from '@/Components/form/DatePicker';
import TableActionDropdown from '@/Components/ui/TableActionDropdown';
import InvoiceDetailModal from './modals/InvoiceDetailModal';
import PayInvoiceModal from '../modals/PayInvoiceModal';
import PlotAndInvoiceModal from '../modals/PlotAndInvoiceModal';

export default function InvoiceIndex({ auth, invoices, filters, summary = {}, classes = [], priceMasters = [] }) {
    const getStartOfMonth = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}-01`;
    };

    const getToday = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const [search, setSearch] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(filters.start_date || getStartOfMonth());
    const [endDate, setEndDate] = useState(filters.end_date || getToday());
    const [status, setStatus] = useState(filters.status || '');
    const [type, setType] = useState(filters.type || '');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Plot / Invoice Edit Modal state
    const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
    const [selectedPlotEntity, setSelectedPlotEntity] = useState(null);
    const [plotEntityType, setPlotEntityType] = useState('lead');

    // Auto-filter logic
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(route('admin.finance.invoices.index'), {
                search,
                start_date: startDate,
                end_date: endDate,
                status,
                type
            }, {
                preserveState: true,
                replace: true,
                preserveScroll: true
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search, startDate, endDate, status, type]);


    const handleReset = () => {
        const start = getStartOfMonth();
        const end = getToday();
        setSearch('');
        setStartDate(start);
        setEndDate(end);
        setStatus('');
        setType('');
        router.get(route('admin.finance.invoices.index'), {
            start_date: start,
            end_date: end,
        });
    };

    const handleWhatsApp = async (invoice) => {
        const phone = invoice.lead?.phone || invoice.student?.lead?.phone || '';
        if (!phone) {
            alert('Nomor WhatsApp tidak tersedia untuk invoice ini.');
            return;
        }

        let normalized = phone.replace(/[^0-9]/g, '');
        if (normalized.startsWith('0')) normalized = '62' + normalized.slice(1);
        else if (!normalized.startsWith('62')) normalized = '62' + normalized;

        const customerName = invoice.lead?.name || invoice.student?.lead?.name || 'Siswa';
        const amount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(invoice.total_amount);
        const magicUrl = `${window.location.origin}/invoice/${invoice.id}`;
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

        const isPaid = invoice.status === 'paid';
        let msg = `Halo *${customerName}*,\n\n`;
        if (isPaid) {
            msg += `Berikut adalah bukti pembayaran ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                   `📄 No. Invoice: *${invoice.invoice_number}*\n💰 Total Terbayar: *${amount}*\n\n` +
                   `Silakan klik link berikut untuk melihat / mengunduh bukti pembayaran Anda:\n🔗 ${magicUrl}\n\nTerima kasih! 🙏`;
        } else {
            msg += `Berikut adalah tagihan ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                   `📄 No. Invoice: *${invoice.invoice_number}*\n💰 Total Tagihan: *${amount}*\n\n` +
                   `Silakan klik link berikut untuk melihat / mengunduh invoice Anda:\n🔗 ${magicUrl}\n\nSilakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih! 🙏`;
        }

        if (!confirm(`Kirim invoice ke ${customerName} (${normalized}) via WhatsApp?`)) return;

        try {
            await axios.post(route('admin.whatsapp.send'), {
                branch: branchCode,
                phone: normalized,
                message: msg,
            });
            alert(`Invoice berhasil dikirim ke ${customerName} via WhatsApp!`);
        } catch (error) {
            console.error('Error sending WA:', error);
            alert('Gagal mengirim WhatsApp: ' + (error.response?.data?.error || error.response?.data?.message || 'Server error'));
        }
    };

    const handleCopyMagicLink = (invoice) => {
        const magicUrl = `${window.location.origin}/invoice/${invoice.id}`;
        navigator.clipboard.writeText(magicUrl);
        alert(`Invoice link ${invoice.invoice_number} berhasil disalin:\n${magicUrl}`);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState(null);

    const handleOpenPayModal = (inv) => {
        let invoiceObj = inv;
        if (typeof inv === 'string' || typeof inv === 'number') {
            invoiceObj = invoices.data?.find(i => i.id === inv) || selectedInvoice;
        }
        setSelectedInvoiceToPay(invoiceObj);
        setIsPayModalOpen(true);
    };

    const handleConfirmPay = (paymentMethod, callback) => {
        if (!selectedInvoiceToPay) return;
        router.post(
            route('admin.finance.invoices.pay', selectedInvoiceToPay.id),
            { payment_method: paymentMethod },
            {
                onFinish: () => {
                    if (callback) callback();
                    setIsPayModalOpen(false);
                    setSelectedInvoiceToPay(null);
                    setIsDetailModalOpen(false);
                },
            }
        );
    };

    const handleShowDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Invoice History" />

            <div className="py-12 bg-slate-50 min-h-screen">
                <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <Link
                                href={route('admin.finance.dashboard')}
                                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-black uppercase tracking-widest mb-4"
                            >
                                <ArrowLeft size={14} /> Back to Billing Center
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                                Invoice <span className="text-red-600">History</span>
                            </h1>
                            <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-wider">
                                Kelola dan cari riwayat transaksi pembayaran siswa
                            </p>
                        </div>

                    </div>

                    {/* Summary Cards Row */}
                    <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Card 1: Paid Invoices */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                                <CheckCircle size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Paid Invoices</p>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none truncate">
                                    {formatCurrency(summary.paid_amount || 0)}
                                </h3>
                                <p className="text-[11px] font-bold text-emerald-600 mt-1">
                                    {summary.paid_count || 0} Invoices
                                </p>
                            </div>
                        </div>

                        {/* Card 2: Pending Invoices */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                                <Clock size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Pending Invoices</p>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none truncate">
                                    {formatCurrency(summary.pending_amount || 0)}
                                </h3>
                                <p className="text-[11px] font-bold text-amber-600 mt-1">
                                    {summary.pending_count || 0} Invoices
                                </p>
                            </div>
                        </div>

                        {/* Card 3: Cancelled Invoices */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
                                <XCircle size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Cancelled Invoices</p>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none truncate">
                                    {summary.cancelled_count || 0} Invoices
                                </h3>
                                <p className="text-[11px] font-bold text-rose-600 mt-1">
                                    Dibatalkan
                                </p>
                            </div>
                        </div>

                        {/* Card 4: Total Invoices */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                            <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl shrink-0">
                                <FileText size={22} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Records</p>
                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none truncate">
                                    {invoices.total || summary.total_count || 0} Invoices
                                </h3>
                                <p className="text-[11px] font-bold text-slate-500 mt-1">
                                    Filtered Period
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                            <div className="md:col-span-4 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Customer / INV</label>
                                <SearchInput 
                                    placeholder="Cari nama atau nomor..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="!max-w-none"
                                />
                            </div>

                            <div className="md:col-span-3 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePicker 
                                        value={startDate}
                                        onChange={setStartDate}
                                        placeholder="Start Date"
                                    />
                                    <DatePicker 
                                        value={endDate}
                                        onChange={setEndDate}
                                        placeholder="End Date"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <select 
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-4 focus:ring-red-100 focus:border-red-200 transition-all appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em',
                                    }}
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe</label>
                                <select 
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700 focus:ring-4 focus:ring-red-100 focus:border-red-200 transition-all appearance-none"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                        backgroundPosition: 'right 0.5rem center',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundSize: '1.5em 1.5em',
                                    }}
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="new_join">New Join</option>
                                    <option value="paket_lanjut">Paket Lanjut</option>
                                    <option value="rejoin">Rejoin</option>
                                    <option value="placement_test">Placement Test</option>
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <button 
                                    type="button"
                                    onClick={handleReset}
                                    className="w-full flex items-center justify-center p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all border border-slate-100"
                                    title="Reset Filters"
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <Table>
                        <THead>
                            <TR hover={false}>
                                <TH>Invoice</TH>
                                <TH>Customer</TH>
                                <TH>Class</TH>
                                <TH>Date</TH>
                                <TH>Amount</TH>
                                <TH>Status</TH>
                                <TH className="text-right">Actions</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {invoices.data.length > 0 ? (
                                invoices.data.map((invoice, index) => {
                                    const total = invoices.data.length;
                                    const isNearBottom = total > 1 && index >= total - (total <= 2 ? 1 : 2);
                                    let typeBadgeLabel = 'New Join';
                                    let typeBadgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';

                                    const typeVal = invoice.type || (invoice.student_id ? 'rejoin' : 'new_join');

                                    if (typeVal === 'placement_test' || (!invoice.study_class_id && invoice.items?.some(i => i.name?.includes('Placement Test')))) {
                                        typeBadgeLabel = 'Placement Test';
                                        typeBadgeStyle = 'bg-purple-50 text-purple-600 border-purple-100';
                                    } else if (typeVal === 'rejoin') {
                                        if (invoice.student?.rejoin_count > 0 || invoice.notes?.includes('renewal')) {
                                            typeBadgeLabel = 'Paket Lanjut';
                                            typeBadgeStyle = 'bg-blue-50 text-blue-600 border-blue-100';
                                        } else {
                                            typeBadgeLabel = 'Rejoin';
                                            typeBadgeStyle = 'bg-violet-50 text-violet-600 border-violet-100';
                                        }
                                    }

                                    return (
                                    <TR key={invoice.id}>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-tight">{invoice.invoice_number}</span>
                                                <span className={`mt-1 inline-block self-start px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${typeBadgeStyle}`}>
                                                    {typeBadgeLabel}
                                                </span>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                    {invoice.lead?.name || invoice.student?.lead?.name || 'Unknown'}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400">{invoice.lead?.phone || invoice.student?.lead?.phone || '-'}</span>
                                                </div>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                    {invoice.study_class?.name || <span className="text-slate-300 italic font-medium">Manual Items</span>}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {invoice.study_class && (
                                                        <span className="text-[10px] font-bold text-slate-400">{invoice.session_count} Sessions</span>
                                                    )}
                                                    {invoice.student && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            Selesai: {invoice.student.rejoin_count || 0} Paket
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                    {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">At {new Date(invoice.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900">{formatCurrency(invoice.total_amount)}</span>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${
                                                    invoice.status === 'paid' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' 
                                                    : invoice.status === 'cancelled'
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {invoice.status}
                                                </span>
                                                {invoice.status === 'paid' && invoice.payment_method && (
                                                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                                                        {invoice.payment_method}
                                                    </span>
                                                )}
                                            </div>
                                        </TD>
                                        <TD className="text-right">
                                            <TableActionDropdown align={isNearBottom ? "top-right" : "right"}>
                                                <TableActionDropdown.Item 
                                                    onClick={() => handleShowDetails(invoice)}
                                                    icon={FileText}
                                                >
                                                    Detail Invoice
                                                </TableActionDropdown.Item>
                                                <TableActionDropdown.Item 
                                                    onClick={() => handleCopyMagicLink(invoice)}
                                                    icon={Copy}
                                                >
                                                    Copy Invoice Link
                                                </TableActionDropdown.Item>
                                                <TableActionDropdown.Item 
                                                    onClick={() => handleWhatsApp(invoice)}
                                                    icon={MessageCircle}
                                                >
                                                    Kirim via WhatsApp
                                                </TableActionDropdown.Item>
                                                <TableActionDropdown.Item 
                                                    onClick={() => window.open(route('admin.finance.invoices.download', invoice.id), '_blank')}
                                                    icon={Download}
                                                >
                                                    Download PDF
                                                </TableActionDropdown.Item>
                                                {invoice.status === 'pending' && (
                                                    <>
                                                        <TableActionDropdown.Item 
                                                            onClick={() => {
                                                                const entity = invoice.student || invoice.lead;
                                                                const type = invoice.student ? 'student' : 'lead';
                                                                setSelectedInvoice(invoice);
                                                                if (entity) {
                                                                    setPlotEntityType(type);
                                                                    setSelectedPlotEntity(entity);
                                                                    setIsPlotModalOpen(true);
                                                                } else {
                                                                    handleShowDetails(invoice);
                                                                }
                                                            }}
                                                            icon={Edit2}
                                                        >
                                                            Edit Invoice
                                                        </TableActionDropdown.Item>
                                                        <TableActionDropdown.Item 
                                                            onClick={() => handleOpenPayModal(invoice)}
                                                            icon={CheckCircle}
                                                        >
                                                            Terima Pembayaran
                                                        </TableActionDropdown.Item>
                                                    </>
                                                )}
                                            </TableActionDropdown>
                                        </TD>
                                    </TR>
                                    );
                                })
                            ) : (
                                <TR hover={false}>
                                    <TD colSpan="6" className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                                <FileText size={48} className="text-slate-200" />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Tidak ada invoice ditemukan</h3>
                                            <p className="text-xs text-slate-300 font-bold mt-2">Coba ubah kata kunci atau filter Anda</p>
                                        </div>
                                    </TD>
                                </TR>
                            )}
                        </TBody>
                    </Table>

                    {/* Pagination */}
                    {invoices.total > 0 && (
                        <div className="mt-8 flex items-center justify-between bg-white px-8 py-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900 font-black">{invoices.from}-{invoices.to}</span> of <span className="text-slate-900 font-black">{invoices.total}</span> Invoices
                            </p>
                            <Pagination links={invoices.links} />
                        </div>
                    )}
                </div>
            </div>

            <InvoiceDetailModal 
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                invoice={selectedInvoice}
                onPay={handleOpenPayModal}
            />

            <PlotAndInvoiceModal 
                show={isPlotModalOpen}
                onClose={() => {
                    setIsPlotModalOpen(false);
                    setSelectedInvoice(null);
                }}
                lead={plotEntityType === 'lead' ? selectedPlotEntity : selectedPlotEntity?.lead}
                student={plotEntityType === 'student' ? selectedPlotEntity : null}
                targetInvoice={selectedInvoice}
                classes={classes}
                priceMasters={priceMasters}
            />

            <PayInvoiceModal
                isOpen={isPayModalOpen}
                onClose={() => {
                    setIsPayModalOpen(false);
                    setSelectedInvoiceToPay(null);
                }}
                onConfirm={handleConfirmPay}
                invoiceNumber={selectedInvoiceToPay?.invoice_number}
                totalAmount={selectedInvoiceToPay?.total_amount}
            />
        </AuthenticatedLayout>
    );
}
