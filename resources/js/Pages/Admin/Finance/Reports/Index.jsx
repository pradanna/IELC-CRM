import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { 
    TrendingUp, DollarSign, Clock, Tag, Search,
    Percent, BarChart3, Users, BookOpen, AlertCircle,
    Calendar, Filter, CalendarDays, Eye, FileText, Download, FileSpreadsheet, RotateCcw
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer
} from 'recharts';
import Button from '@/Components/ui/Button';
import SearchInput from '@/Components/ui/SearchInput';
import StatusBadge from '@/Components/ui/StatusBadge';
import DataTable from '@/Components/ui/DataTable';
import InvoiceDetailModal from '../Invoices/modals/InvoiceDetailModal';

export default function Index({ stats, filters = {}, branches = [], studyClasses = [] }) {
    const [activeTab, setActiveTab] = useState(filters.tab || 'summary'); // 'summary' | 'daily'
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [branchId, setBranchId] = useState(filters.branch_id || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [studyClassId, setStudyClassId] = useState(filters.study_class_id || '');
    const [dailyDate, setDailyDate] = useState(filters.daily_date || new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const handleFilter = () => {
        router.get(route('admin.finance.reports.index'), {
            tab: activeTab,
            start_date: startDate,
            end_date: endDate,
            branch_id: branchId,
            type: typeFilter,
            study_class_id: studyClassId,
            daily_date: dailyDate,
            search: search,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setBranchId('');
        setTypeFilter('');
        setStudyClassId('');
        setDailyDate(new Date().toISOString().split('T')[0]);
        setSearch('');
        router.get(route('admin.finance.reports.index'));
    };

    const handleExportPdf = () => {
        const url = route('admin.finance.reports.export-pdf', {
            tab: activeTab,
            start_date: startDate,
            end_date: endDate,
            daily_date: dailyDate,
            branch_id: branchId,
            type: typeFilter,
            study_class_id: studyClassId,
            search: search,
        });
        window.open(url, '_blank');
    };

    const handleExportExcel = () => {
        const url = route('admin.finance.reports.export-excel', {
            tab: activeTab,
            start_date: startDate,
            end_date: endDate,
            daily_date: dailyDate,
            branch_id: branchId,
            type: typeFilter,
            study_class_id: studyClassId,
            search: search,
        });
        window.open(url, '_blank');
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const studentTypeBreakdown = useMemo(() => {
        const newRev = stats.new_join_revenue || 0;
        const rejoinRev = stats.rejoin_revenue || 0;
        const paketLanjutRev = stats.paket_lanjut_revenue || 0;
        const total = newRev + rejoinRev + paketLanjutRev;
        if (total === 0) return { newPercent: 0, rejoinPercent: 0, paketLanjutPercent: 0 };
        return {
            newPercent: Math.round((newRev / total) * 100),
            rejoinPercent: Math.round((rejoinRev / total) * 100),
            paketLanjutPercent: Math.round((paketLanjutRev / total) * 100),
        };
    }, [stats.new_join_revenue, stats.rejoin_revenue, stats.paket_lanjut_revenue]);

    // Filter classes based on selected branch if branch selected
    const filteredClasses = useMemo(() => {
        if (!branchId) return studyClasses;
        return studyClasses.filter(c => String(c.branch_id) === String(branchId));
    }, [studyClasses, branchId]);

    const getTypeBadge = (type, studentId) => {
        const isRejoin = type === 'rejoin' || (!type && studentId);
        const isPaketLanjut = type === 'paket_lanjut';
        const isPlacement = type === 'placement_test';

        if (isPlacement) {
            return <StatusBadge color="#b45309" backgroundColor="#fef3c7">Placement Test</StatusBadge>;
        }
        if (isPaketLanjut) {
            return <StatusBadge color="#0369a1" backgroundColor="#e0f2fe">Paket Lanjut</StatusBadge>;
        }
        if (isRejoin) {
            return <StatusBadge color="#6b21a8" backgroundColor="#f3e8ff">Rejoin</StatusBadge>;
        }
        return <StatusBadge color="#047857" backgroundColor="#d1fae5">New Join</StatusBadge>;
    };

    const columns = [
        {
            header: 'No. Invoice',
            accessor: 'invoice_number',
            render: (row) => <span className="font-bold text-slate-800">{row.invoice_number}</span>
        },
        {
            header: 'Tipe',
            accessor: 'type',
            render: (row) => getTypeBadge(row.type, row.student_id)
        },
        {
            header: 'Pelanggan',
            accessor: 'customer',
            render: (row) => {
                const name = row.lead?.name || row.student?.lead?.name || 'Unknown';
                const phone = row.lead?.phone || row.student?.lead?.phone || '-';
                return (
                    <div>
                        <div className="font-bold text-slate-900">{name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{phone}</div>
                    </div>
                );
            }
        },
        {
            header: 'Kelas / Produk',
            accessor: 'study_class',
            render: (row) => (
                <div>
                    <div className="font-bold text-slate-800">{row.study_class?.name || 'Manual Item'}</div>
                    <div className="text-[11px] text-slate-400">{row.study_class?.branch?.name || '-'}</div>
                </div>
            )
        },
        {
            header: 'Diskon',
            accessor: 'discount_amount',
            render: (row) => <span className="font-bold text-rose-600">{formatCurrency(row.discount_amount)}</span>
        },
        {
            header: 'Total Bayar',
            accessor: 'total_amount',
            render: (row) => <span className="font-black text-emerald-600">{formatCurrency(row.total_amount)}</span>
        },
        {
            header: 'Aksi',
            accessor: 'id',
            render: (row) => (
                <button
                    type="button"
                    onClick={() => setSelectedInvoice(row)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all inline-flex items-center justify-center"
                    title="Lihat Detail Invoice"
                >
                    <Eye size={18} />
                </button>
            )
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Keuangan" />

            <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <span>LAPORAN KEUANGAN</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            ANALISIS PENDAPATAN, PIUTANG, DAN TREN TRANSAKSI CRM
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleExportPdf}
                            variant="primary"
                            icon={FileText}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-full shadow-lg shadow-red-600/20 px-5 py-2.5"
                        >
                            Export PDF ({activeTab === 'daily' ? 'Harian' : 'Ringkasan'})
                        </Button>
                        <Button
                            onClick={handleExportExcel}
                            variant="secondary"
                            icon={FileSpreadsheet}
                            className="!bg-emerald-600 hover:!bg-emerald-700 text-white text-xs font-bold uppercase rounded-full shadow-lg shadow-emerald-600/20 px-5 py-2.5"
                        >
                            Export Excel ({activeTab === 'daily' ? 'Harian' : 'Ringkasan'})
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            type="button"
                            onClick={() => setActiveTab('summary')}
                            className={`pb-4 px-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === 'summary'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <BarChart3 size={16} />
                            <span>RINGKASAN</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('daily')}
                            className={`pb-4 px-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === 'daily'
                                    ? 'border-red-600 text-red-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <CalendarDays size={16} />
                            <span>PENDAPATAN HARIAN / DETIL TRANSAKSI</span>
                        </button>
                    </nav>
                </div>

                {/* Filter Bar with Generous Padding & Integrated Search Input */}
                <div className="bg-white px-6 py-5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filter Badge Label */}
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-full text-slate-700 text-xs font-black uppercase tracking-wider shrink-0">
                            <Filter size={14} className="text-red-600" />
                            <span>Dashboard Filters</span>
                        </div>

                        {/* Direct Native Clean Search Input in Filter Bar */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari invoice / nama..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                className="bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-xs w-44 md:w-56"
                            />
                        </div>

                        {/* Date Inputs */}
                        {activeTab === 'summary' ? (
                            <>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-xs"
                                        title="Tanggal Mulai"
                                    />
                                </div>
                                <span className="text-slate-300 text-xs font-bold">-</span>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-xs"
                                        title="Tanggal Selesai"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dailyDate}
                                    onChange={(e) => setDailyDate(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-xs"
                                    title="Pilih Tanggal Harian"
                                />
                            </div>
                        )}

                        {/* Branch Select */}
                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-xs pr-8"
                        >
                            <option value="">Semua Cabang</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>

                        {/* Type Select */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-xs pr-8"
                        >
                            <option value="">Semua Tipe</option>
                            <option value="new_join">New Join</option>
                            <option value="rejoin">Rejoin</option>
                            <option value="paket_lanjut">Paket Lanjut</option>
                            <option value="placement_test">Placement Test</option>
                        </select>

                        {/* Class Select */}
                        <select
                            value={studyClassId}
                            onChange={(e) => setStudyClassId(e.target.value)}
                            className="bg-white border border-slate-200 rounded-full px-4 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-xs pr-8 max-w-[180px] truncate"
                        >
                            <option value="">Semua Kelas</option>
                            {filteredClasses.map((cls) => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>

                        {/* Apply Button */}
                        <Button
                            onClick={handleFilter}
                            variant="primary"
                            className="!py-2 !px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider !rounded-full shadow-md shadow-red-600/10"
                        >
                            Terapkan
                        </Button>
                    </div>

                    {/* Right-aligned Clear All / Reset Button */}
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors shrink-0 ml-auto"
                    >
                        Clear All
                    </button>
                </div>

                {/* TAB 1: RINGKASAN */}
                {activeTab === 'summary' && (
                    <div className="space-y-8">
                        {/* Hero Section: Filtered Period Revenue Summary */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
                            <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                            
                            <div className="space-y-2 relative z-10">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={20} className="text-red-500" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">
                                        Pendapatan Periode Filter ({startDate || 'Awal Bulan'} s/d {endDate || 'Hari Ini'})
                                    </span>
                                </div>
                                <h2 className="text-4xl font-black tracking-tight text-white">{formatCurrency(stats.total_revenue)}</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Akumulasi total pendapatan lunas terfilter berdasarkan kriteria periode & filter yang dipilih
                                </p>
                            </div>

                            <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 space-y-1 shrink-0 relative z-10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pendapatan Month-to-Date (Bulan Ini)</span>
                                <p className="text-xl font-black text-emerald-400">
                                    {formatCurrency(stats.mtd_revenue)}
                                </p>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pendapatan (Filtered)</span>
                                        <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-1">{formatCurrency(stats.total_revenue)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <DollarSign size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Piutang (Pending)</span>
                                        <h3 className="text-2xl font-black text-amber-500 tracking-tight mt-1">{formatCurrency(stats.total_pending)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
                                        <Clock size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Diskon Diberikan</span>
                                        <h3 className="text-2xl font-black text-rose-500 tracking-tight mt-1">{formatCurrency(stats.total_discount)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                                        <Percent size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 w-24 h-24 bg-violet-50 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform"></div>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rata-rata Nilai Invoice</span>
                                        <h3 className="text-2xl font-black text-violet-600 tracking-tight mt-1">{formatCurrency(stats.average_order_value)}</h3>
                                    </div>
                                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                                        <Tag size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column: Monthly Trend Graph */}
                            <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tren Pendapatan Bulanan</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pendapatan lunas 6 bulan terakhir</p>
                                    </div>
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <TrendingUp size={18} />
                                    </div>
                                </div>

                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.monthly_trend}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="month" 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                fontWeight="bold"
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                stroke="#94a3b8" 
                                                fontSize={10} 
                                                fontWeight="bold"
                                                tickLine={false}
                                                tickFormatter={(value) => `Rp ${value / 1000000}M`}
                                            />
                                            <Tooltip 
                                                formatter={(value) => [formatCurrency(value), 'Pendapatan']}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="total" 
                                                stroke="#10b981" 
                                                strokeWidth={3}
                                                fillOpacity={1} 
                                                fill="url(#colorRevenue)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Right Column: Breakdown & Products */}
                            <div className="lg:col-span-4 space-y-8">
                                {/* New Join vs Rejoin vs Paket Lanjut Breakdown */}
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tipe Pendaftaran</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Proporsi New Join, Rejoin & Paket Lanjut</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-emerald-700 uppercase">New Join ({studentTypeBreakdown.newPercent}%)</span>
                                                <span className="text-slate-900 font-black">{formatCurrency(stats.new_join_revenue)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${studentTypeBreakdown.newPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-purple-700 uppercase">Rejoin ({studentTypeBreakdown.rejoinPercent}%)</span>
                                                <span className="text-slate-900 font-black">{formatCurrency(stats.rejoin_revenue)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${studentTypeBreakdown.rejoinPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span className="text-sky-700 uppercase">Paket Lanjut ({studentTypeBreakdown.paketLanjutPercent}%)</span>
                                                <span className="text-slate-900 font-black">{formatCurrency(stats.paket_lanjut_revenue)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${studentTypeBreakdown.paketLanjutPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Revenue Classes */}
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Top Kelas / Program</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pendapatan tertinggi per kelas</p>
                                    </div>

                                    <div className="space-y-3">
                                        {stats.class_revenue?.length > 0 ? (
                                            stats.class_revenue.slice(0, 5).map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 font-black text-xs flex items-center justify-center">
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 uppercase">{item.class_name}</h4>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.count || 0} invoice</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{formatCurrency(item.total)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 font-bold italic text-center py-4">Belum ada data kelas</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: PENDAPATAN HARIAN / DETIL TRANSAKSI */}
                {activeTab === 'daily' && (
                    <div className="space-y-8">
                        {/* Clean Daily Revenue Banner */}
                        <div className="bg-[#007043] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-800">
                            <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                            
                            <div className="space-y-2 relative z-10">
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={20} className="text-emerald-200" />
                                    <span className="text-xs font-black uppercase tracking-widest text-emerald-100">
                                        Laporan Pendapatan Hari Ini ({new Date(dailyDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})
                                    </span>
                                </div>
                                <h2 className="text-4xl font-black tracking-tight">{formatCurrency(stats.today_revenue)}</h2>
                                <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                                    Total {stats.today_invoices?.length || 0} Invoice Lunas Terfilter
                                </p>
                            </div>
                        </div>

                        {/* Daily Transactions Table Header & Card */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                        Rincian List Pembayaran Hari Ini ({new Date(dailyDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                        Daftar seluruh transaksi lunas yang tercatat pada tanggal {dailyDate}
                                    </p>
                                </div>
                                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-black text-xs uppercase tracking-wider">
                                    Total Terfilter: {formatCurrency(stats.today_revenue)}
                                </span>
                            </div>

                            <DataTable
                                data={stats.today_invoices || []}
                                columns={columns}
                                itemsPerPage={15}
                                noPanel={true}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Invoice Detail Modal */}
            <InvoiceDetailModal
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                invoice={selectedInvoice}
                onPay={() => {}}
            />
        </AuthenticatedLayout>
    );
}
