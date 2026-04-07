import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Calculator, Receipt, User, 
    CheckCircle, History,
    CheckCircle2, Clock, Search, Download
} from 'lucide-react';
import PlotAndInvoiceModal from './modals/PlotAndInvoiceModal';
import DataTable from '@/Components/ui/DataTable';
import SearchInput from '@/Components/ui/SearchInput';

export default function Index({ leads, classes, priceMasters, recentInvoices }) {
    const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [search, setSearch] = useState('');

    const openPlotModal = (lead) => {
        setSelectedLead(lead);
        setIsPlotModalOpen(true);
    };

    const handlePayInvoice = (invoiceId) => {
        if (confirm('Mark this invoice as paid? This will automatically promote the lead to current student and enroll them in the class.')) {
            router.post(route('admin.finance.invoices.pay', invoiceId));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const filteredLeads = leads.filter(lead => 
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search) ||
        lead.branch?.name.toLowerCase().includes(search.toLowerCase())
    );

    const leadColumns = [
        {
            header: 'Lead Name',
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">{row.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.branch?.name}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Lead Type',
            accessor: 'lead_type.name',
            render: (row) => (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                    {row.lead_type?.name}
                </span>
            )
        },
        {
            header: 'Status',
            render: () => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Plotting</span>
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (row) => (
                <button 
                    onClick={() => openPlotModal(row)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/10 transition-all active:scale-95"
                >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Plot & Invoice</span>
                </button>
            )
        }
    ];

    return (
        <AdminLayout>
            <Head title="Finance Dashboard" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Finance <span className="text-red-600">Dashboard</span>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase flex items-center gap-2">
                             System Overview & Invoice Control Center
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Leads for Invoicing */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Leads Awaiting Invoicing ({leads.length})</h2>
                            </div>

                            <SearchInput 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search leads..."
                                className="!max-w-xs"
                            />
                        </div>

                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden p-2">
                            <DataTable 
                                data={filteredLeads}
                                columns={leadColumns}
                                itemsPerPage={10}
                                isLoading={false}
                            />
                        </div>

                        {filteredLeads.length === 0 && search && (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                                <Search className="w-12 h-12 text-slate-200" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching leads for "{search}"</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                                <History className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Recent Invoices</h2>
                        </div>

                        <div className="space-y-4">
                            {recentInvoices.length > 0 ? recentInvoices.map((invoice) => (
                                <div key={invoice.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-red-100 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{invoice.invoice_number}</span>
                                                <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-tighter ${getStatusStyle(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[180px]">
                                                {invoice.lead?.name || invoice.student?.name}
                                            </h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-red-600 leading-none">{formatCurrency(invoice.total_amount)}</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{invoice.session_count} Sessions</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <a 
                                            href={route('admin.finance.invoices.download', invoice.id)}
                                            target="_blank"
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-slate-200/50"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Download PDF</span>
                                        </a>

                                        {invoice.status === 'pending' && (
                                            <button 
                                                onClick={() => handlePayInvoice(invoice.id)}
                                                className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Mark Paid</span>
                                            </button>
                                        )}
                                        
                                        {invoice.status === 'paid' && (
                                            <div className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                                <CheckCircle className="w-3 h-3" />
                                                <span className="text-[8px] font-black uppercase tracking-widest">Enrollment Verified</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center py-10">No recent invoice history</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PlotAndInvoiceModal 
                show={isPlotModalOpen}
                onClose={() => setIsPlotModalOpen(false)}
                lead={selectedLead}
                classes={classes}
                priceMasters={priceMasters}
            />
        </AdminLayout>
    );
}
