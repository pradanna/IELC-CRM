import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Calculator, Receipt, User, 
    BookOpen, CheckCircle, CreditCard, 
    History, ArrowUpRight, TrendingUp,
    CheckCircle2, Clock, XCircle
} from 'lucide-react';
import PlotAndInvoiceModal from './modals/PlotAndInvoiceModal';

export default function Index({ leads, classes, priceMasters, recentInvoices }) {
    const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Leads for Invoicing */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Leads Awaiting Invoicing ({leads.length})</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {leads.length > 0 ? leads.map((lead) => (
                                <div key={lead.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-red-500 group-hover:bg-red-50 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 line-clamp-1 uppercase">{lead.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{lead.lead_type?.name}</span>
                                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                    <span className="text-[10px] font-bold text-slate-400">{lead.branch?.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => openPlotModal(lead)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all active:scale-95"
                                    >
                                        <Calculator className="w-3.5 h-3.5" />
                                        <span>Plot & Generate Invoice</span>
                                    </button>
                                </div>
                            )) : (
                                <div className="md:col-span-2 py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200 opacity-50">
                                    <Clock className="w-12 h-12 text-slate-300 mb-4" />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No leads in Invoice Phase</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="space-y-8">
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

                                    {invoice.status === 'pending' && (
                                        <button 
                                            onClick={() => handlePayInvoice(invoice.id)}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Mark as Paid & Promote</span>
                                        </button>
                                    )}
                                    
                                    {invoice.status === 'paid' && (
                                        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                            <CheckCircle className="w-4 h-4" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Enrollment Verified</span>
                                        </div>
                                    )}
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
