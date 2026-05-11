import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { 
    Calculator, Receipt, User, 
    CheckCircle, History,
    CheckCircle2, Clock, Search, Download, MessageCircle, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import PlotAndInvoiceModal from './modals/PlotAndInvoiceModal';
import DataTable from '@/Components/ui/DataTable';
import SearchInput from '@/Components/ui/SearchInput';
import Button from '@/Components/ui/Button';

export default function Index({ leads, rejoinStudents, classes, priceMasters, recentInvoices }) {
    const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState(null); // Can be lead or student
    const [entityType, setEntityType] = useState('lead'); // 'lead' or 'student'
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'rejoin'

    const openPlotModal = (entity, type = 'lead') => {
        setSelectedEntity(entity);
        setEntityType(type);
        setIsPlotModalOpen(true);
    };

    const handlePayInvoice = (invoiceId) => {
        if (confirm('Mark this invoice as paid? This will automatically promote the lead to current student and enroll them in the class.')) {
            router.post(route('admin.finance.invoices.pay', invoiceId));
        }
    };
    
    const handleSendInvoiceWA = async (invoice) => {
        const lead = invoice.lead;
        if (!lead) {
            alert('Cannot find lead data for this invoice.');
            return;
        }

        const publicUrl = route('public.invoice.download', invoice.id);
        const message = `Halo *${lead.nickname || lead.name}*,\n\n` +
                        `Berikut adalah link invoice pendaftaran Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                        `${publicUrl}\n\n` +
                        `Silakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih! 🙏`;
        
        if (window.confirm(`Kirim invoice ${invoice.invoice_number} via WhatsApp?`)) {
            try {
                // Use LeadController's endpoint to ensure logging to LeadChatLog
                await axios.post(route('admin.crm.leads.send-whatsapp', lead.id), { 
                    message: message 
                });
                alert('Invoice berhasil dikirim via WhatsApp.');
            } catch (err) {
                alert('Gagal mengirim WhatsApp: ' + (err.response?.data?.message || err.message));
            }
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
            header: 'Entity Name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">{activeTab === 'new' ? row.name : row.lead?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {activeTab === 'new' ? row.branch?.name : row.lead?.branch?.name}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: activeTab === 'new' ? 'Lead Type' : 'Last Class',
            render: (row) => (
                activeTab === 'new' ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                        {row.lead_type?.name}
                    </span>
                ) : (
                    <span className="text-xs font-bold text-slate-600">
                        {row.study_classes?.[0]?.name || 'No history'}
                    </span>
                )
            )
        },
        {
            header: 'Status',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${activeTab === 'new' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {activeTab === 'new' ? 'Awaiting Plotting' : 'Inactive (Rejoin)'}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (row) => (
                <Button 
                    onClick={() => openPlotModal(activeTab === 'new' ? row : row, activeTab === 'new' ? 'lead' : 'student')}
                    variant="primary"
                    icon={Calculator}
                    className="inline-flex py-2 px-4 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/10"
                >
                    Plot & Invoice
                </Button>
            )
        }
    ];

    const currentData = activeTab === 'new' ? filteredLeads : rejoinStudents.filter(s => 
        s.lead?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Finance Dashboard" />

            <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
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
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                                <Button 
                                    onClick={() => setActiveTab('new')}
                                    variant="ghost"
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-none ${activeTab === 'new' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                >
                                    New Leads ({leads.length})
                                </Button>
                                <Button 
                                    onClick={() => setActiveTab('rejoin')}
                                    variant="ghost"
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-none ${activeTab === 'rejoin' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                >
                                    Rejoin Students ({rejoinStudents.length})
                                </Button>
                            </div>

                            <SearchInput 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="!max-w-xs"
                            />
                        </div>

                        <DataTable 
                            data={currentData}
                            columns={leadColumns}
                            itemsPerPage={10}
                            isLoading={false}
                        />

                        {currentData.length === 0 && search && (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                                <Search className="w-12 h-12 text-slate-200" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching leads for "{search}"</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                                    <History className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Recent Invoices</h2>
                            </div>
                            <Link 
                                href={route('admin.finance.invoices.index')}
                                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
                            >
                                <ExternalLink size={12} />
                                View All History
                            </Link>
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
                                            className="px-3 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-slate-200/50"
                                            title="Download PDF"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </a>

                                        <Button 
                                            variant="ghost"
                                            onClick={() => handleSendInvoiceWA(invoice)}
                                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-emerald-100/50 shadow-none"
                                            title="Send via WhatsApp"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                        </Button>

                                        {invoice.status === 'pending' && (
                                            <Button 
                                                onClick={() => handlePayInvoice(invoice.id)}
                                                variant="primary"
                                                icon={CheckCircle2}
                                                className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
                                            >
                                                Mark Paid
                                            </Button>
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
                lead={entityType === 'lead' ? selectedEntity : selectedEntity?.lead}
                student={entityType === 'student' ? selectedEntity : null}
                classes={classes}
                priceMasters={priceMasters}
            />
        </AuthenticatedLayout>
    );
}
