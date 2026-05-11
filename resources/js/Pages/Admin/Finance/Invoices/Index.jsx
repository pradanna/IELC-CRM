import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
    RotateCcw
} from 'lucide-react';
import Pagination from '@/Components/ui/Pagination';
import { Table, THead, TBody, TR, TH, TD } from '@/Components/ui/Table';
import Button from '@/Components/ui/Button';
import SearchInput from '@/Components/ui/SearchInput';
import TextInput from '@/Components/TextInput';
import DatePicker from '@/Components/form/DatePicker';

export default function InvoiceIndex({ auth, invoices, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    // Auto-filter logic
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(route('admin.finance.invoices.index'), {
                search,
                start_date: startDate,
                end_date: endDate,
                status
            }, {
                preserveState: true,
                replace: true,
                preserveScroll: true
            });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search, startDate, endDate, status]);

    const handleReset = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        setStatus('');
        router.get(route('admin.finance.invoices.index'));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
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
                                <ArrowLeft size={14} /> Back to Dashboard
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                                Invoice <span className="text-red-600">History</span>
                            </h1>
                            <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-wider">
                                Kelola dan cari riwayat transaksi pembayaran siswa
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Records</p>
                                    <h3 className="text-xl font-black text-slate-900 leading-none">{invoices.total} Invoices</h3>
                                </div>
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

                            <div className="md:col-span-4 space-y-2">
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

                            <div className="md:col-span-3 space-y-2">
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
                                <TH>Date</TH>
                                <TH>Amount</TH>
                                <TH>Status</TH>
                                <TH className="text-right">Actions</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {invoices.data.length > 0 ? (
                                invoices.data.map((invoice) => (
                                    <TR key={invoice.id}>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-tight">{invoice.invoice_number}</span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">{invoice.study_class?.name || 'Manual Items'}</span>
                                            </div>
                                        </TD>
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                    {invoice.lead?.name || invoice.student?.lead?.name || 'Unknown'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">{invoice.lead?.phone || invoice.student?.lead?.phone || '-'}</span>
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
                                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">{invoice.session_count} Sessions</span>
                                            </div>
                                        </TD>
                                        <TD>
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${
                                                invoice.status === 'paid' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' 
                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {invoice.status}
                                            </span>
                                        </TD>
                                        <TD className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a 
                                                    href={route('admin.finance.invoices.download', invoice.id)} 
                                                    target="_blank"
                                                    className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 rounded-xl transition-all shadow-sm"
                                                    title="Download PDF"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </TD>
                                    </TR>
                                ))
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
                    {invoices.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-between bg-white px-8 py-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Showing <span className="text-slate-900 font-black">{invoices.from}-{invoices.to}</span> of <span className="text-slate-900 font-black">{invoices.total}</span> Invoices
                            </p>
                            <Pagination links={invoices.links} />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
