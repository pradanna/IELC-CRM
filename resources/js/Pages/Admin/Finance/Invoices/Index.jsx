import React, { useState } from 'react';
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
    MessageCircle
} from 'lucide-react';
import Pagination from '@/Components/ui/Pagination';

export default function InvoiceIndex({ auth, invoices, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.finance.invoices.index'), {
            search,
            start_date: startDate,
            end_date: endDate,
            status
        }, {
            preserveState: true,
            replace: true
        });
    };

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
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Invoice History</h2>}
        >
            <Head title="Invoice History" />

            <div className="py-12 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
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
                            <div className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
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
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
                        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Customer / INV</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Cari nama atau nomor..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-red-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-2xl text-[11px] font-bold text-slate-700 focus:ring-4 focus:ring-red-100 transition-all"
                                    />
                                    <span className="text-slate-300">-</span>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-2xl text-[11px] font-bold text-slate-700 focus:ring-4 focus:ring-red-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <select 
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-red-100 transition-all"
                                >
                                    <option value="">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    type="submit"
                                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                                >
                                    <Filter size={14} /> Filter
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.data.length > 0 ? (
                                        invoices.data.map((invoice) => (
                                            <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-tight">{invoice.invoice_number}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{invoice.study_class?.name || 'Manual Items'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                            {invoice.lead?.name || invoice.student?.lead?.name || 'Unknown'}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{invoice.lead?.phone || invoice.student?.lead?.phone || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                                                            {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">At {new Date(invoice.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-slate-900">{formatCurrency(invoice.total_amount)}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{invoice.session_count} Sessions</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${
                                                        invoice.status === 'paid' 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' 
                                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                        {invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
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
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-8 py-32 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="p-6 bg-slate-50 rounded-full mb-4">
                                                        <FileText size={48} className="text-slate-200" />
                                                    </div>
                                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Tidak ada invoice ditemukan</h3>
                                                    <p className="text-xs text-slate-300 font-bold mt-2">Coba ubah kata kunci atau filter Anda</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {invoices.last_page > 1 && (
                            <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Showing <span className="text-slate-900 font-black">{invoices.from}-{invoices.to}</span> of <span className="text-slate-900 font-black">{invoices.total}</span> Invoices
                                </p>
                                <div className="flex items-center gap-2">
                                    {invoices.links.map((link, i) => {
                                        if (link.label.includes('Previous')) {
                                            return (
                                                <Link 
                                                    key={i} 
                                                    href={link.url} 
                                                    className={`p-2 rounded-xl border transition-all ${link.url ? 'bg-white text-slate-600 border-slate-100 hover:border-red-200 hover:text-red-600' : 'bg-slate-50 text-slate-300 border-transparent opacity-50 cursor-not-allowed'}`}
                                                >
                                                    <ChevronLeft size={16} />
                                                </Link>
                                            );
                                        }
                                        if (link.label.includes('Next')) {
                                            return (
                                                <Link 
                                                    key={i} 
                                                    href={link.url} 
                                                    className={`p-2 rounded-xl border transition-all ${link.url ? 'bg-white text-slate-600 border-slate-100 hover:border-red-200 hover:text-red-600' : 'bg-slate-50 text-slate-300 border-transparent opacity-50 cursor-not-allowed'}`}
                                                >
                                                    <ChevronRight size={16} />
                                                </Link>
                                            );
                                        }
                                        if (link.label === '...') {
                                            return <span key={i} className="px-4 py-2 text-slate-300">...</span>;
                                        }
                                        return (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${link.active ? 'bg-red-600 text-white shadow-lg shadow-red-500/20 border-transparent' : 'bg-white text-slate-500 border-slate-100 hover:border-red-200 hover:text-red-600'}`}
                                            >
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
