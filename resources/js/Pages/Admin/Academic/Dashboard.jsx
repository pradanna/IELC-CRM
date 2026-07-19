import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    GraduationCap, Users, BookOpen, Laptop,
    Activity, TrendingUp, Calendar, Building2, 
    ShieldAlert, Filter, ChevronDown, X
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function AcademicDashboardContent({ reports, filters, onFilterChange, hideHeader = false }) {
    const [activeTab, setActiveTab] = useState(filters?.tab || 'overall');

    const { overall, join_patterns, siswa_stop, grades } = reports;
    const { year, month, available_years } = filters;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

    const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

    // ── Navigation ───────────────────────────────────────────────
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    const handleFilterChange = (newFilters) => {
        const params = {
            year: newFilters.year !== undefined ? newFilters.year : year,
            month: newFilters.month !== undefined ? newFilters.month : month,
            tab: activeTab,
        };
        // Remove empty values
        Object.keys(params).forEach(k => {
            if (params[k] === null || params[k] === undefined || params[k] === '') delete params[k];
        });
        if (onFilterChange) {
            onFilterChange(params);
        }
    };

    // ── Filter Bar Sub-component ─────────────────────────────────
    const FilterBar = ({ showMonth = true }) => (
        <div className="flex items-center gap-3 flex-wrap bg-slate-50/80 border border-slate-200/50 backdrop-blur-md rounded-2xl px-5 py-3">
            <div className="flex items-center gap-2 mr-1">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter</span>
            </div>

            {/* Year Selector */}
            <div className="relative flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 hover:border-red-300 hover:shadow-sm transition-all duration-200 group">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                <select
                    value={year}
                    onChange={(e) => handleFilterChange({ year: parseInt(e.target.value) })}
                    className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer pr-5 appearance-none"
                >
                    {available_years?.map(y => (
                        <option key={y} value={y}>Tahun {y}</option>
                    ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Month Selector */}
            {showMonth && (
                <div className="relative flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 group">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <select
                        value={month || ''}
                        onChange={(e) => handleFilterChange({ month: e.target.value ? parseInt(e.target.value) : null })}
                        className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer pr-5 appearance-none"
                    >
                        <option value="">Semua Bulan</option>
                        {MONTH_NAMES.map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
            )}

            {/* Active filters indicator + Reset */}
            {month && (
                <button
                    onClick={() => handleFilterChange({ month: null })}
                    className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                >
                    <X className="w-3 h-3" />
                    Reset Bulan
                </button>
            )}

            {/* Filter summary badge */}
            <div className="ml-auto text-[10px] font-bold text-slate-400">
                {month
                    ? `${MONTH_NAMES[month - 1]} ${year}`
                    : `Tahun ${year}`
                }
            </div>
        </div>
    );

    // ── Dynamic label for "new students" card ────────────────────
    const targetMonthName = overall.target_month
        ? MONTH_NAMES[(overall.target_month || 1) - 1]
        : MONTH_NAMES[new Date().getMonth()];

    return (
        <div className="space-y-10">
            {/* ═══ Header ═══════════════════════════════════════ */}
            {!hideHeader && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Academic <span className="text-red-600">Dashboard</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-0.5">
                            <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                            Academic Analytics &amp; Student Distribution Reports
                        </p>
                    </div>
                </div>
            )}

            {/* ═══ Tabs Navigation ═════════════════════════════ */}
                <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-md">
                    {[
                        { id: 'overall', label: 'Overall Overview', icon: GraduationCap },
                        { id: 'join_patterns', label: 'Pola Join (Online/Offline)', icon: Laptop },
                        { id: 'siswa_stop', label: 'Siswa Stop', icon: ShieldAlert },
                        { id: 'grades', label: 'Tingkat Pendidikan', icon: BookOpen }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border border-transparent ${
                                    isActive 
                                        ? 'bg-white text-slate-900 shadow-sm border-slate-200/50 scale-105 font-extrabold' 
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                }`}
                            >
                                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-500' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ═══════════════════════════════════════════════════
                    TAB: OVERALL
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'overall' && (
                    <div className="space-y-8 animate-fadeIn">
                        <FilterBar showMonth={true} />

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 border border-indigo-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Total Siswa Aktif {month ? `(${MONTH_NAMES[month-1]} ${year})` : `(${year})`}
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {formatNumber(overall.total_active)}
                                        <span className="text-xs font-bold text-slate-400">siswa</span>
                                    </h3>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/20 border border-emerald-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Siswa Baru ({targetMonthName} {year})
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        +{formatNumber(overall.new_this_month)}
                                        <span className="text-xs font-bold text-slate-400">terdaftar</span>
                                    </h3>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/20 border border-purple-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-purple-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Coverage</p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {formatNumber(overall.branch_distribution.length)}
                                        <span className="text-xs font-bold text-slate-400">cabang aktif</span>
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Trend & Branch Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Tren Pertumbuhan Siswa Aktif</h4>
                                    <span className="text-[10px] font-black text-slate-450 uppercase bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">Tahun {year}</span>
                                </div>
                                {overall.monthly_trend.length > 0 ? (
                                    <div className="h-96 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={overall.monthly_trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', fontFamily: 'sans-serif', fontSize: '12px' }} />
                                                <Area type="monotone" dataKey="students" name="Students" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-96 flex items-center justify-center text-slate-400 text-sm font-bold">
                                        Tidak ada data untuk tahun {year}
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-6 flex flex-col justify-between">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Distribusi Cabang</h4>
                                {overall.branch_distribution.length > 0 ? (
                                    <>
                                        <div className="h-64 w-full relative flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={overall.branch_distribution}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={4}
                                                        dataKey="value"
                                                    >
                                                        {overall.branch_distribution.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-2 max-h-36 overflow-y-auto">
                                            {overall.branch_distribution.map((item, index) => (
                                                <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                        <span className="font-bold text-slate-600">{item.name}</span>
                                                    </div>
                                                    <span className="font-black text-slate-800">{item.value} siswa</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-bold">
                                        Tidak ada data
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB: POLA JOIN
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'join_patterns' && (
                    <div className="space-y-8 animate-fadeIn">
                        <FilterBar showMonth={true} />

                        {join_patterns.length > 0 ? (
                            <>
                                {/* Chart & Summary */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Online vs Offline per Tipe Program</h4>
                                        <div className="h-96 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={join_patterns} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="program" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                    <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9' }} />
                                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                                    <Bar dataKey="offline" name="Offline Learning" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="online" name="Online Learning" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-6">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Rasio Ringkasan</h4>
                                        <div className="space-y-4">
                                            {join_patterns.map((item) => {
                                                const offlinePct = item.total > 0 ? Math.round((item.offline / item.total) * 100) : 0;
                                                const onlinePct = item.total > 0 ? Math.round((item.online / item.total) * 100) : 0;
                                                return (
                                                    <div key={item.program} className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-black text-slate-800 uppercase tracking-wider">{item.program}</span>
                                                            <span className="font-bold text-slate-400">{item.total} Total</span>
                                                        </div>
                                                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                                                            <div className="bg-emerald-500 h-full" style={{ width: `${offlinePct}%` }} title={`Offline: ${offlinePct}%`} />
                                                            <div className="bg-indigo-500 h-full" style={{ width: `${onlinePct}%` }} title={`Online: ${onlinePct}%`} />
                                                        </div>
                                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                            <span className="text-emerald-600">{offlinePct}% Offline ({item.offline})</span>
                                                            <span className="text-indigo-600">{onlinePct}% Online ({item.online})</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Data Table */}
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Tabel Data Pola Join</h4>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipe Program</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Offline</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Online</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Total</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Rasio (Offline : Online)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {join_patterns.map((row) => (
                                                    <tr key={row.program} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-4 font-black text-slate-800 uppercase tracking-wider text-xs">{row.program}</td>
                                                        <td className="px-8 py-4 text-center text-xs font-bold text-slate-650">{row.offline}</td>
                                                        <td className="px-8 py-4 text-center text-xs font-bold text-slate-650">{row.online}</td>
                                                        <td className="px-8 py-4 text-center text-xs font-black text-slate-900">{row.total}</td>
                                                        <td className="px-8 py-4 text-right text-xs font-black text-indigo-600">
                                                            {row.total > 0 ? `${Math.round((row.offline/row.total)*100)}%` : '0%'} : {row.total > 0 ? `${Math.round((row.online/row.total)*100)}%` : '0%'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-4">
                                <Laptop className="w-12 h-12 text-slate-300" />
                                <p className="text-sm font-bold text-slate-400">
                                    Tidak ada data pola join untuk {month ? `${MONTH_NAMES[month - 1]} ${year}` : `tahun ${year}`}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB: SISWA STOP
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'siswa_stop' && (
                    <div className="space-y-8 animate-fadeIn">
                        <FilterBar showMonth={true} />

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-rose-50/50 to-rose-100/20 border border-rose-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-rose-500/20">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Total Siswa Stop {month ? `(${MONTH_NAMES[month - 1]} ${year})` : `(${year})`}
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {formatNumber(siswa_stop.total_stopped)}
                                        <span className="text-xs font-bold text-slate-400">siswa</span>
                                    </h3>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/20 border border-slate-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-slate-700 text-white rounded-xl flex items-center justify-center shadow-md shadow-slate-700/20">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulan Terakhir Stop</p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {siswa_stop.monthly_trend.length > 0 ? siswa_stop.monthly_trend[siswa_stop.monthly_trend.length - 1]?.stopped : 0}
                                        <span className="text-xs font-bold text-slate-400">siswa</span>
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Stopped Trend Chart */}
                        <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Tren Siswa Stop per Bulan</h4>
                                <span className="text-[10px] font-black text-slate-450 uppercase bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">Tahun {year}</span>
                            </div>
                            {siswa_stop.monthly_trend.length > 0 ? (
                                <div className="h-96 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={siswa_stop.monthly_trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9' }} />
                                            <Bar dataKey="stopped" name="Siswa Stop" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-96 flex items-center justify-center text-slate-400 text-sm font-bold">
                                    Tidak ada data siswa stop untuk tahun {year}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB: TINGKAT PENDIDIKAN
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'grades' && (
                    <div className="space-y-8 animate-fadeIn">
                        <FilterBar showMonth={true} />

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Segmentasi Demografi Tingkat Sekolah</h4>
                                {grades.some(g => g.count > 0) ? (
                                    <div className="h-96 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={grades} layout="vertical" margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9' }} />
                                                <Bar dataKey="count" name="Siswa Aktif" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                                    {grades.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-96 flex items-center justify-center text-slate-400 text-sm font-bold">
                                        Tidak ada data untuk {month ? `${MONTH_NAMES[month - 1]} ${year}` : `tahun ${year}`}
                                    </div>
                                )}
                            </div>

                            <div className="lg:col-span-4 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-6">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ringkasan Tingkat Sekolah</h4>
                                <div className="space-y-2">
                                    {grades.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="font-bold text-slate-650">{item.name}</span>
                                            </div>
                                            <span className="font-black text-slate-800">{item.count} siswa</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

export default function Dashboard({ reports, filters }) {
    return (
        <AdminLayout>
            <Head title="Academic" />
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm max-w-lg mx-auto space-y-6">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <GraduationCap className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Modul Akademik</h3>
                        <p className="text-xs font-bold text-slate-405 leading-relaxed max-w-sm mx-auto">
                            Halaman ini sedang dalam pemeliharaan. Laporan statistik dan analisis siswa saat ini telah dipindahkan ke menu **Students (Tab Statistik & Analisis)**.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
