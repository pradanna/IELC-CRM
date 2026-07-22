import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { 
    Calculator, Receipt, User, 
    CheckCircle, History, BookOpen,
    CheckCircle2, Clock, Search, Download, MessageCircle, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import PlotAndInvoiceModal from './modals/PlotAndInvoiceModal';
import DataTable from '@/Components/ui/DataTable';
import SearchInput from '@/Components/ui/SearchInput';
import Button from '@/Components/ui/Button';

export default function Index({ leads, placementTestLeads = [], rejoinStudents = [], paketLanjutStudents = [], classes, priceMasters, recentInvoices, expiringClasses }) {
    const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState(null); // Can be lead or student
    const [entityType, setEntityType] = useState('lead'); // 'lead' or 'student'
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('placement_test'); // 'placement_test', 'new', 'paket_lanjut', or 'rejoin'

    const expiringClassesList = useMemo(() => {
        if (!expiringClasses) return [];
        if (Array.isArray(expiringClasses)) return expiringClasses;
        if (expiringClasses.data && Array.isArray(expiringClasses.data)) return expiringClasses.data;
        return [];
    }, [expiringClasses]);

    const filteredPlacementTestLeads = useMemo(() => {
        return (placementTestLeads || []).filter(lead =>
            lead.name.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone?.includes(search) ||
            lead.branch?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [placementTestLeads, search]);

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
        const name = lead.nickname || lead.name;
        const isPaid = invoice.status === 'paid';
        
        let typeLabel = 'pendaftaran';
        if (invoice.type === 'placement_test') {
            typeLabel = 'placement test';
        } else if (invoice.type === 'rejoin') {
            typeLabel = 'rejoin';
        } else if (invoice.type === 'paket_lanjut') {
            typeLabel = 'paket lanjut';
        }

        let message = `Halo *${name}*,\n\n`;
        if (isPaid) {
            message += `Berikut adalah bukti pembayaran ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                       `${publicUrl}\n\n` +
                       `Terima kasih! 🙏`;
        } else {
            message += `Berikut adalah tagihan ${typeLabel} Anda untuk nomor *${invoice.invoice_number}*:\n\n` +
                       `${publicUrl}\n\n` +
                       `Silakan lakukan pembayaran dan kirimkan bukti transfernya ya. Terima kasih! 🙏`;
        }
        
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
                        <p className="font-black text-slate-900 tracking-tight uppercase">{(activeTab === 'new' || activeTab === 'placement_test') ? row.name : row.lead?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {(activeTab === 'new' || activeTab === 'placement_test') ? row.branch?.name : row.lead?.branch?.name}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: (activeTab === 'new' || activeTab === 'placement_test') ? 'Lead Type' : 'Last Class',
            render: (row) => (
                (activeTab === 'new' || activeTab === 'placement_test') ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                        {row.lead_type?.name || 'General'}
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
                    <div className={`w-2 h-2 rounded-full ${activeTab === 'placement_test' ? 'bg-purple-500 animate-pulse' : activeTab === 'new' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {activeTab === 'placement_test' ? 'Placement Test' : activeTab === 'new' ? 'Awaiting Plotting' : 'Inactive (Rejoin)'}
                    </span>
                </div>
            )
        },
        {
            header: 'Invoice Status',
            render: (row) => {
                const invoiceCount = row.pending_invoices_count ?? null;
                if (invoiceCount === null) return null;

                if (invoiceCount > 0) {
                    return (
                        <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Invoiced
                        </span>
                    );
                }

                return (
                    <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Not Yet
                    </span>
                );
            }
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (row) => {
                const alreadyInvoiced = (row.pending_invoices_count ?? 0) > 0;

                if (alreadyInvoiced) {
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1.5 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Invoice Sent
                            </span>
                            <Button
                                onClick={() => openPlotModal(row, 'lead')}
                                variant="ghost"
                                icon={Calculator}
                                className="inline-flex py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-slate-400 hover:text-slate-700 border border-slate-200"
                                title="Re-generate invoice"
                            >
                                Re-Invoice
                            </Button>
                        </div>
                    );
                }

                return (
                    <Button 
                        onClick={() => openPlotModal(row, (activeTab === 'placement_test' || activeTab === 'new') ? 'lead' : 'student')}
                        variant="primary"
                        icon={Calculator}
                        className="inline-flex py-2 px-4 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/10"
                    >
                        Generate Invoice
                    </Button>
                );
            }
        }
    ];

    const filteredExpiringClasses = useMemo(() => {
        return expiringClassesList.filter(studyClass =>
            studyClass.name.toLowerCase().includes(search.toLowerCase()) ||
            studyClass.branch?.name?.toLowerCase().includes(search.toLowerCase()) ||
            studyClass.instructor?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [expiringClassesList, search]);

    const filteredRejoinStudents = useMemo(() => {
        return rejoinStudents.filter(student =>
            (student.lead?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (student.student_number || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [rejoinStudents, search]);

    const formatIndoDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    const getRemainingDays = (endDateStr) => {
        if (!endDateStr) return '';
        const end = new Date(endDateStr);
        const today = new Date();
        end.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return `${Math.abs(diffDays)} hari yang lalu`;
        } else if (diffDays === 0) {
            return 'Hari ini';
        } else {
            return `${diffDays} hari lagi`;
        }
    };

    const handleBulkClassInvoice = (studyClass) => {
        const studentCount = studyClass.students?.length || 0;
        if (studentCount === 0) {
            alert('Tidak ada siswa aktif di kelas ini.');
            return;
        }
        if (!studyClass.price_master) {
            alert('Kelas ini tidak memiliki Price Master (master harga) yang valid.');
            return;
        }

        const message = `Apakah Anda yakin ingin menerbitkan invoice renewal secara massal untuk ${studentCount} siswa aktif di kelas ${studyClass.name}?\n\n` +
                        `Ini akan membuat invoice otomatis dengan mode "Full" menggunakan tarif ${formatCurrency(studyClass.price_master.price_per_session)}.`;
        
        if (confirm(message)) {
            router.post(route('admin.finance.classes.bulk-invoice', studyClass.id));
        }
    };

    const expiringClassColumns = [
        {
            header: 'Class Details',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">{row.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {row.branch?.name} • {row.instructor?.name || 'No Instructor'}
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: 'Students & Rate',
            render: (row) => {
                const studentCount = row.students?.length || 0;
                return (
                    <div className="space-y-1">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-100">
                            {studentCount} Active Students
                        </span>
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                            {row.price_master ? formatCurrency(row.price_master.price_per_session) : 'No price master rate'}
                        </p>
                    </div>
                );
            }
        },
        {
            header: 'Invoice Status',
            render: (row) => {
                const studentCount = row.students?.length || 0;
                const invoiceCount = row.pending_bulk_invoices_count ?? null;
                if (invoiceCount === null) return null;

                if (invoiceCount > 0) {
                    return (
                        <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" />
                                Invoiced
                            </span>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                                {invoiceCount} of {studentCount} students
                            </p>
                        </div>
                    );
                }

                return (
                    <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        Not Yet
                    </span>
                );
            }
        },
        {
            header: 'Ends On / Urgency',
            render: (row) => {
                const remainingDays = row.end_session_date ? Math.ceil((new Date(row.end_session_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)) : 0;
                const isUrgent = remainingDays <= 5;
                return (
                    <div className="space-y-1">
                        <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border ${
                            isUrgent 
                                ? 'bg-rose-50 text-rose-700 border-rose-100' 
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                            {getRemainingDays(row.end_session_date)}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {formatIndoDate(row.end_session_date)}
                        </p>
                    </div>
                );
            }
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (row) => {
                const studentCount = row.students?.length || 0;
                const hasPriceMaster = !!row.price_master;
                const isDisabled = studentCount === 0 || !hasPriceMaster;
                const alreadyInvoiced = (row.pending_bulk_invoices_count ?? 0) > 0;

                if (alreadyInvoiced) {
                    return (
                        <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1.5 py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Invoice Sent
                            </span>
                            <Button
                                onClick={() => handleBulkClassInvoice(row)}
                                variant="ghost"
                                icon={Receipt}
                                className="inline-flex py-2 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-slate-400 hover:text-slate-700 border border-slate-200"
                                title="Re-generate bulk invoice"
                            >
                                Re-Invoice
                            </Button>
                        </div>
                    );
                }

                return (
                    <Button 
                        onClick={() => handleBulkClassInvoice(row)}
                        variant="primary"
                        icon={Receipt}
                        disabled={isDisabled}
                        className={`inline-flex py-2 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg ${
                            isDisabled 
                                ? 'bg-slate-200 text-slate-400 border-slate-200 shadow-none cursor-not-allowed' 
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/10'
                        }`}
                        title={studentCount === 0 ? "No active students to invoice" : !hasPriceMaster ? "No price master assigned to class" : "Generate invoices for all students in this class"}
                    >
                        Bulk Invoice
                    </Button>
                );
            }
        }
    ];
    const rejoinStudentColumns = [
        {
            header: 'Siswa Rejoin',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 tracking-tight uppercase">{row.lead?.name || 'Unknown Student'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {row.student_number} • Join {row.rejoin_count || 0}x
                        </p>
                    </div>
                </div>
            )
        },
        {
            header: 'Kelas Terakhir',
            render: (row) => {
                const lastClass = row.study_classes?.[0];
                return (
                    <div>
                        <p className="font-black text-slate-700 tracking-tight uppercase">{lastClass?.name || 'Belum Ada Kelas'}</p>
                        {lastClass && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Stop Tanggal: {formatIndoDate(row.stopped_at || lastClass?.end_session_date)}
                            </p>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'Paket Selesai',
            render: (row) => (
                <span className="px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest border bg-emerald-50 text-emerald-700 border-emerald-100">
                    {row.rejoin_count || 0} Paket
                </span>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            render: (row) => (
                <Button 
                    onClick={() => openPlotModal(row, 'student')}
                    variant="primary"
                    icon={Calculator}
                    className="inline-flex py-2 px-4 bg-red-600 hover:bg-red-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-600/10"
                >
                    Generate Invoice
                </Button>
            )
        }
    ];

    let currentData = [];
    let currentColumns = [];

    if (activeTab === 'placement_test') {
        currentData = filteredPlacementTestLeads;
        currentColumns = leadColumns;
    } else if (activeTab === 'new') {
        currentData = filteredLeads;
        currentColumns = leadColumns;
    } else if (activeTab === 'paket_lanjut') {
        currentData = filteredExpiringClasses;
        currentColumns = expiringClassColumns;
    } else if (activeTab === 'rejoin') {
        currentData = filteredRejoinStudents;
        currentColumns = rejoinStudentColumns;
    }

    return (
        <AuthenticatedLayout>
            <Head title="Billing Center" />

            <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Billing <span className="text-red-600">Center</span>
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
                                    onClick={() => setActiveTab('placement_test')}
                                    variant="ghost"
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-none ${activeTab === 'placement_test' ? 'bg-white text-purple-700 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                >
                                    Placement Test ({(placementTestLeads || []).length})
                                </Button>
                                <Button 
                                    onClick={() => setActiveTab('new')}
                                    variant="ghost"
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-none ${activeTab === 'new' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                >
                                    New Leads ({leads.length})
                                </Button>
                                <Button 
                                    onClick={() => setActiveTab('paket_lanjut')}
                                    variant="ghost"
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-none ${activeTab === 'paket_lanjut' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                >
                                    Paket Lanjut ({expiringClassesList.length})
                                </Button>
                                <Button 
                                    onClick={() => setActiveTab('rejoin')}
                                    variant="ghost"
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-none ${activeTab === 'rejoin' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                >
                                    Rejoin ({rejoinStudents.length})
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
                            columns={currentColumns}
                            itemsPerPage={10}
                            isLoading={false}
                        />

                        {currentData.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                                <Search className="w-12 h-12 text-slate-200" />
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                    {search ? `No results found for "${search}"` : 'No items available'}
                                </p>
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
