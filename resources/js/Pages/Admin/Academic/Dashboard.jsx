import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    GraduationCap, Users, BookOpen, Laptop,
    Activity, TrendingUp, Calendar, Building2, 
    ShieldAlert, Filter, ChevronDown, X, MapPin, Search, FileText,
    ArrowRightLeft, ArrowRight
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import ExportButtons from '@/Components/ui/ExportButtons';
import ExportDropdown from '@/Components/ui/ExportDropdown';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function AcademicDashboardContent({ reports, filters, onFilterChange, hideHeader = false }) {
    const [activeTab, setActiveTab] = useState(filters?.tab || 'overall');

    const { overall, join_patterns, siswa_stop, class_transfers, grades } = reports || {};
    const [selectedMonthData, setSelectedMonthData] = useState(null);
    const [selectedGradeData, setSelectedGradeData] = useState(null);
    const [searchStudentInModal, setSearchStudentInModal] = useState('');
    const [searchStoppedTable, setSearchStoppedTable] = useState('');
    const [searchTransfersTable, setSearchTransfersTable] = useState('');
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const { year, month, mode, branch_id, available_years, available_branches } = filters;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

    const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num);

    const formatIndonesianDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-';
        if (typeof dateStr === 'string' && /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(dateStr.trim())) {
            return dateStr;
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const renderStudentAvatar = (student, size = 'md') => {
        const name = student.name || student.student_name || 'S';
        const photoUrl = student.profile_picture || student.profile_picture_url || null;
        const avatarUrl = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=334155&bold=true&size=256`;
        const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';

        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setPreviewPhoto({
                        name: name,
                        student_number: student.student_number || student.phone || '',
                        branch: student.branch_name || student.branch || '',
                        photo_url: avatarUrl,
                        is_custom_photo: !!photoUrl,
                    });
                }}
                title="Klik untuk melihat foto"
                className={`${sizeClasses} rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-xs relative group cursor-pointer hover:ring-2 hover:ring-rose-400 hover:scale-105 transition-all bg-slate-100 flex items-center justify-center`}
            >
                <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=334155&bold=true&size=256`;
                    }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Search className="w-3.5 h-3.5 text-white drop-shadow" />
                </div>
            </button>
        );
    };

    // ── Navigation ───────────────────────────────────────────────
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        // Clear stale month/mode/branch filter when going to overall
        if (tabId === 'overall' && (month || mode || branch_id) && onFilterChange) {
            onFilterChange({ year, month: null, mode: null, branch_id: null, tab: tabId });
        }
    };

    // ── Export helpers ────────────────────────────────────────────
    const buildExportUrl = (format, tab) => {
        const base = format === 'excel'
            ? '/admin/academic/students/export/excel'
            : '/admin/academic/students/export/pdf';
        const params = new URLSearchParams({ tab, year });
        if (month) params.set('month', month);
        if (mode) params.set('mode', mode);
        if (branch_id) params.set('branch_id', branch_id);
        return `${base}?${params.toString()}`;
    };

    const handleFilterChange = (newFilters) => {
        const params = {
            year: newFilters.year !== undefined ? newFilters.year : year,
            month: newFilters.month !== undefined ? newFilters.month : month,
            mode: newFilters.mode !== undefined ? newFilters.mode : mode,
            branch_id: newFilters.branch_id !== undefined ? newFilters.branch_id : branch_id,
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
    const FilterBar = ({ showMonth = true, showMode = false, showBranch = true }) => (
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

            {/* Mode Selector (On Campus / Online) */}
            {showMode && (
                <div className="relative flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 group">
                    <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                    <select
                        value={mode || ''}
                        onChange={(e) => handleFilterChange({ mode: e.target.value || null })}
                        className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer pr-5 appearance-none"
                    >
                        <option value="">Semua Mode</option>
                        <option value="offline">On Campus</option>
                        <option value="online">Online</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
            )}

            {/* Branch Selector */}
            {showBranch && available_branches?.length > 0 && (
                <div className="relative flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 hover:border-amber-300 hover:shadow-sm transition-all duration-200 group">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <select
                        value={branch_id ? String(branch_id) : ''}
                        onChange={(e) => handleFilterChange({ branch_id: e.target.value || null })}
                        className="text-xs font-bold text-slate-700 bg-transparent border-none outline-none cursor-pointer pr-5 appearance-none"
                    >
                        <option value="">Semua Cabang</option>
                        {available_branches.map(b => (
                            <option key={b.id} value={String(b.id)}>{b.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 pointer-events-none" />
                </div>
            )}

            {/* Active filters indicator + Reset */}
            {(month || mode || branch_id) && (
                <button
                    onClick={() => handleFilterChange({ month: null, mode: null, branch_id: null })}
                    className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                >
                    <X className="w-3 h-3" />
                    Reset Filter
                </button>
            )}

            {/* Filter summary badge */}
            <div className="ml-auto text-[10px] font-bold text-slate-400 flex items-center gap-2">
                {branch_id && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-extrabold uppercase">
                        {available_branches?.find(b => String(b.id) === String(branch_id))?.name || 'Cabang'}
                    </span>
                )}
                {mode && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-extrabold uppercase">
                        {mode === 'offline' ? 'On Campus' : 'Online'}
                    </span>
                )}
                <span>
                    {month
                        ? `${MONTH_NAMES[month - 1]} ${year}`
                        : `Tahun ${year}`
                    }
                </span>
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
                <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/50 backdrop-blur-md flex-wrap">
                    {[
                        { id: 'overall', label: 'Overall Overview', icon: GraduationCap },
                        { id: 'join_patterns', label: 'Pola Join (Online/Offline)', icon: Laptop },
                        { id: 'siswa_stop', label: 'Siswa Stop', icon: ShieldAlert },
                        { id: 'class_transfers', label: 'Riwayat Pindah Kelas', icon: ArrowRightLeft },
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
                        <div className="space-y-3">
                            <FilterBar showMonth={false} showMode={true} />
                            <div className="flex justify-end items-center gap-3 flex-wrap">
                                <ExportButtons
                                    onPdf={buildExportUrl('pdf', 'branch_matrix')}
                                    onExcel={buildExportUrl('excel', 'branch_matrix')}
                                    label="Matriks Cabang"
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* Stats Cards (4 Columns) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Total Siswa Aktif */}
                            <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 border border-indigo-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Total Siswa Aktif
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {formatNumber(overall.total_active)}
                                        <span className="text-xs font-bold text-slate-400">siswa</span>
                                    </h3>
                                </div>
                            </div>

                            {/* Offline Students */}
                            <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/20 border border-amber-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Siswa Offline (Tatap Muka)</p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {formatNumber(overall.offline_count || 0)}
                                        <span className="text-xs font-bold text-amber-600 font-extrabold">
                                            ({overall.total_active > 0 ? Math.round(((overall.offline_count || 0) / overall.total_active) * 100) : 0}%)
                                        </span>
                                    </h3>
                                </div>
                            </div>

                            {/* Online Students */}
                            <div className="bg-gradient-to-br from-sky-50/50 to-sky-100/20 border border-sky-100/50 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20">
                                        <Laptop className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-sky-700 uppercase tracking-widest">Siswa Online</p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {formatNumber(overall.online_count || 0)}
                                        <span className="text-xs font-bold text-sky-600 font-extrabold">
                                            ({overall.total_active > 0 ? Math.round(((overall.online_count || 0) / overall.total_active) * 100) : 0}%)
                                        </span>
                                    </h3>
                                </div>
                            </div>

                            {/* Siswa Baru */}
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
                        </div>

                        {/* Trend & Branch Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Tren Pertumbuhan Siswa Aktif</h4>
                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Klik pada titik bulan atau grafik untuk melihat rincian siswa yang bergabung</p>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">Tahun {year}</span>
                                </div>
                                {overall.monthly_trend.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="h-96 w-full cursor-pointer select-none relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart 
                                                    data={overall.monthly_trend} 
                                                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                                                    onClick={(e) => {
                                                        if (e && e.activePayload && e.activePayload.length > 0) {
                                                            setSelectedMonthData(e.activePayload[0].payload);
                                                            setSearchStudentInModal('');
                                                        } else if (e && e.activeTooltipIndex !== undefined && overall.monthly_trend[e.activeTooltipIndex]) {
                                                            setSelectedMonthData(overall.monthly_trend[e.activeTooltipIndex]);
                                                            setSearchStudentInModal('');
                                                        }
                                                    }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                    <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                    <Tooltip 
                                                        wrapperStyle={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                return (
                                                                    <div 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedMonthData(data);
                                                                            setSearchStudentInModal('');
                                                                        }}
                                                                        className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold space-y-1.5 cursor-pointer hover:bg-slate-800 transition-all border border-slate-700/50"
                                                                    >
                                                                        <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{data.month}</div>
                                                                        <div className="flex items-center justify-between gap-4 text-white">
                                                                            <span>Siswa Baru:</span>
                                                                            <span className="font-black text-indigo-400 text-sm">{data.students} Siswa</span>
                                                                        </div>
                                                                        <div className="text-[11px] text-indigo-300 font-bold pt-1.5 border-t border-slate-800 flex items-center gap-1.5">
                                                                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md text-[10px]">👆 Klik Di Sini</span>
                                                                            <span>Buka Daftar Siswa</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="students" 
                                                        name="Students" 
                                                        stroke="#4f46e5" 
                                                        strokeWidth={3} 
                                                        fillOpacity={1} 
                                                        fill="url(#colorStudents)"
                                                        activeDot={({ cx, cy, payload }) => (
                                                            <circle
                                                                cx={cx}
                                                                cy={cy}
                                                                r={9}
                                                                fill="#ffffff"
                                                                stroke="#4f46e5"
                                                                strokeWidth={3.5}
                                                                className="cursor-pointer animate-pulse drop-shadow-md"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (payload) {
                                                                        setSelectedMonthData(payload);
                                                                        setSearchStudentInModal('');
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
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

                        {/* Grafik Distribusi Tingkat Pendidikan (Siswa by Grades) */}
                        <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-red-500" />
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Distribusi Siswa Menurut Tingkat Pendidikan (Grades)</h4>
                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Klik pada diagram batang untuk melihat daftar siswa</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">Grafik Jenjang</span>
                            </div>
                            {overall.grade_distribution && overall.grade_distribution.some(g => g.count > 0) ? (
                                <div className="h-72 w-full cursor-pointer select-none">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={overall.grade_distribution} 
                                            margin={{ top: 20, right: 20, left: -15, bottom: 0 }}
                                            onClick={(e) => {
                                                if (e && e.activePayload && e.activePayload.length > 0) {
                                                    setSelectedGradeData(e.activePayload[0].payload);
                                                    setSearchStudentInModal('');
                                                } else if (e && e.activeTooltipIndex !== undefined && overall.grade_distribution[e.activeTooltipIndex]) {
                                                    setSelectedGradeData(overall.grade_distribution[e.activeTooltipIndex]);
                                                    setSearchStudentInModal('');
                                                }
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                            <Tooltip 
                                                cursor={false}
                                                wrapperStyle={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedGradeData(data);
                                                                    setSearchStudentInModal('');
                                                                }}
                                                                className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-semibold space-y-1 cursor-pointer hover:bg-slate-800 transition-colors"
                                                            >
                                                                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Jenjang {data.name}</div>
                                                                <div className="flex items-center justify-between gap-3 text-white">
                                                                    <span>Jumlah Siswa:</span>
                                                                    <span className="font-black text-purple-400 text-sm">{data.count} Siswa</span>
                                                                </div>
                                                                <div className="text-[10px] text-purple-300 font-medium pt-1 border-t border-slate-800 flex items-center gap-1">
                                                                    <span>👉 Klik untuk rincian siswa</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar 
                                                dataKey="count" 
                                                name="Jumlah Siswa" 
                                                radius={[8, 8, 0, 0]}
                                                className="cursor-pointer"
                                                onClick={(data) => {
                                                    if (data) {
                                                        setSelectedGradeData(data);
                                                        setSearchStudentInModal('');
                                                    }
                                                }}
                                            >
                                                {overall.grade_distribution.map((entry, index) => (
                                                    <Cell 
                                                        key={`grade-cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => {
                                                            setSelectedGradeData(entry);
                                                            setSearchStudentInModal('');
                                                        }}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs font-bold gap-2">
                                    <span>Tidak ada data jenjang sekolah siswa aktif pada periode ini</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB: POLA JOIN
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'join_patterns' && (() => {
                    const { months = [], package_list = [], totals = {} } = join_patterns || {};
                    const hasData = package_list.length > 0;

                    // Summary chart data: total per package (campus + online)
                    const summaryChartData = package_list.map((pkg) => ({
                        program: pkg,
                        'ON CAMPUS': totals[pkg]?.offline ?? 0,
                        'ONLINE':   totals[pkg]?.online  ?? 0,
                    }));

                    // Grand totals (Siswa In)
                    const grandOffline = package_list.reduce((s, p) => s + (totals[p]?.offline ?? 0), 0);
                    const grandOnline  = package_list.reduce((s, p) => s + (totals[p]?.online  ?? 0), 0);

                    // Siswa Out totals
                    const stoppedTotals = join_patterns?.stopped_totals || { online: 0, offline: 0 };

                    // Active months only (has any data)
                    const activeMonths = months.filter(m =>
                        package_list.some(p => (m.packages[p]?.offline ?? 0) + (m.packages[p]?.online ?? 0) > 0)
                        || (m.stopped?.offline ?? 0) + (m.stopped?.online ?? 0) > 0
                    );

                    // Average (based on active months count)
                    const avgCount = activeMonths.length || 1;

                    return (
                        <div className="space-y-8 animate-fadeIn">
                            <div className="space-y-3">
                                <FilterBar showMonth={true} showMode={true} />
                                <div className="flex items-center justify-end">
                                    <ExportDropdown buildExportUrl={buildExportUrl} />
                                </div>
                            </div>

                            {hasData ? (
                                <>
                                    {/* Summary Chart */}
                                    <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                            ON CAMPUS vs ONLINE per Paket Harga — {month ? `${MONTH_NAMES[month - 1]} ${year}` : year}
                                        </h4>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={summaryChartData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis
                                                        dataKey="program"
                                                        tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }}
                                                        angle={-25}
                                                        textAnchor="end"
                                                        interval={0}
                                                    />
                                                    <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '11px' }} />
                                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                                                    <Bar dataKey="ON CAMPUS" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="ONLINE"   fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Pivot Table */}
                                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                                    Data Siswa In & Out — Pola Join {month ? `(Bulan ${MONTH_NAMES[month - 1]})` : 'per Bulan'}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                    Per paket harga × mode belajar (ON CAMPUS / ONLINE)
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                                                    <span className="text-emerald-700">ON CAMPUS</span>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                                                    <span className="text-indigo-700">ONLINE</span>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                                                    <span className="text-rose-700">SISWA OUT</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse" style={{ minWidth: `${240 + package_list.length * 160}px` }}>
                                                <thead>
                                                    {/* Row 1: Package names & Siswa Out & Total */}
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th
                                                            rowSpan={2}
                                                            className="sticky left-0 z-10 bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-slate-200 min-w-[120px]"
                                                        >
                                                            Bulan
                                                        </th>
                                                        {package_list.map((pkg) => (
                                                            <th
                                                                key={pkg}
                                                                colSpan={2}
                                                                className="px-4 py-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.15em] text-center border-r border-slate-200 whitespace-nowrap"
                                                            >
                                                                {pkg}
                                                            </th>
                                                        ))}
                                                        {/* Siswa Out Column */}
                                                        <th
                                                            colSpan={2}
                                                            className="px-4 py-3 text-[9px] font-black text-rose-800 uppercase tracking-[0.15em] text-center bg-rose-50 border-r border-slate-200"
                                                        >
                                                            Siswa Out
                                                        </th>
                                                        {/* Total Column */}
                                                        <th
                                                            colSpan={2}
                                                            className="px-4 py-3 text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] text-center bg-slate-100 border-r border-slate-200"
                                                        >
                                                            Siswa In
                                                        </th>
                                                        {/* Total Students (Snapshot) Column */}
                                                        <th
                                                            rowSpan={2}
                                                            className="px-6 py-3 text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] text-center bg-indigo-50 border-l border-slate-300 min-w-[110px]"
                                                        >
                                                            Total Students
                                                        </th>
                                                    </tr>
                                                    {/* Row 2: ON CAMPUS / ONLINE sub-headers */}
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        {package_list.map((pkg) => (
                                                            <>
                                                                <th key={`${pkg}-campus`} className="px-4 py-2 text-[9px] font-black text-emerald-600 uppercase tracking-wider text-center border-r border-slate-100 whitespace-nowrap">
                                                                    ON CAMPUS
                                                                </th>
                                                                <th key={`${pkg}-online`} className="px-4 py-2 text-[9px] font-black text-indigo-500 uppercase tracking-wider text-center border-r border-slate-200 whitespace-nowrap">
                                                                    ONLINE
                                                                </th>
                                                            </>
                                                        ))}
                                                        {/* Siswa Out sub-headers */}
                                                        <th className="px-4 py-2 text-[9px] font-black text-rose-600 uppercase tracking-wider text-center bg-rose-50 border-r border-slate-100 whitespace-nowrap">
                                                            ON CAMPUS
                                                        </th>
                                                        <th className="px-4 py-2 text-[9px] font-black text-rose-500 uppercase tracking-wider text-center bg-rose-50 border-r border-slate-200 whitespace-nowrap">
                                                            ONLINE
                                                        </th>
                                                        {/* Total sub-headers */}
                                                        <th className="px-4 py-2 text-[9px] font-black text-emerald-600 uppercase tracking-wider text-center bg-slate-100 whitespace-nowrap">
                                                            ON CAMPUS
                                                        </th>
                                                        <th className="px-4 py-2 text-[9px] font-black text-indigo-500 uppercase tracking-wider text-center bg-slate-100 whitespace-nowrap">
                                                            ONLINE
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {(month ? months.filter(m => m.month === parseInt(month)) : months).map((row) => {
                                                        const rowOffline = package_list.reduce((s, p) => s + (row.packages[p]?.offline ?? 0), 0);
                                                        const rowOnline  = package_list.reduce((s, p) => s + (row.packages[p]?.online  ?? 0), 0);
                                                        const stoppedOff = row.stopped?.offline ?? 0;
                                                        const stoppedOn  = row.stopped?.online  ?? 0;
                                                        const totStudents = row.total_students ?? 0;

                                                        const isActiveMonth = rowOffline + rowOnline > 0 || stoppedOff + stoppedOn > 0 || totStudents > 0;
                                                        return (
                                                            <tr
                                                                key={row.month}
                                                                className={`hover:bg-slate-50/60 transition-colors ${!isActiveMonth ? 'opacity-40' : ''}`}
                                                            >
                                                                <td className="sticky left-0 z-10 bg-white px-6 py-3 text-xs font-black text-slate-800 uppercase tracking-wider border-r border-slate-100 whitespace-nowrap">
                                                                    {row.label}
                                                                </td>
                                                                {package_list.map((pkg) => {
                                                                    const campus = row.packages[pkg]?.offline ?? 0;
                                                                    const online = row.packages[pkg]?.online  ?? 0;
                                                                    const campusStudents = row.package_students?.[pkg]?.offline || [];
                                                                    const onlineStudents = row.package_students?.[pkg]?.online || [];
                                                                    return (
                                                                        <>
                                                                            <td 
                                                                                key={`${pkg}-c`} 
                                                                                className={`px-4 py-3 text-center text-xs font-bold border-r border-slate-50 ${campus > 0 ? 'text-emerald-700 hover:bg-emerald-100/70 cursor-pointer font-black underline decoration-emerald-300' : 'text-slate-300'}`}
                                                                                onClick={() => {
                                                                                    if (campus > 0) {
                                                                                        setSelectedGradeData({
                                                                                            grade: `${pkg} (ON CAMPUS) — ${row.label}`,
                                                                                            count: campus,
                                                                                            student_list: campusStudents,
                                                                                        });
                                                                                        setSearchStudentInModal('');
                                                                                    }
                                                                                }}
                                                                                title={campus > 0 ? `Klik untuk melihat ${campus} siswa` : ''}
                                                                            >
                                                                                {campus}
                                                                            </td>
                                                                            <td 
                                                                                key={`${pkg}-o`} 
                                                                                className={`px-4 py-3 text-center text-xs font-bold border-r border-slate-200 ${online > 0 ? 'text-indigo-600 hover:bg-indigo-100/70 cursor-pointer font-black underline decoration-indigo-300' : 'text-slate-300'}`}
                                                                                onClick={() => {
                                                                                    if (online > 0) {
                                                                                        setSelectedGradeData({
                                                                                            grade: `${pkg} (ONLINE) — ${row.label}`,
                                                                                            count: online,
                                                                                            student_list: onlineStudents,
                                                                                        });
                                                                                        setSearchStudentInModal('');
                                                                                    }
                                                                                }}
                                                                                title={online > 0 ? `Klik untuk melihat ${online} siswa` : ''}
                                                                            >
                                                                                {online}
                                                                            </td>
                                                                        </>
                                                                    );
                                                                })}
                                                                {/* Siswa Out Cells */}
                                                                <td 
                                                                    className={`px-4 py-3 text-center text-xs font-bold bg-rose-50/40 border-r border-slate-50 ${stoppedOff > 0 ? 'text-rose-700 hover:bg-rose-100/70 cursor-pointer font-black underline decoration-rose-300' : 'text-slate-300'}`}
                                                                    onClick={() => {
                                                                        if (stoppedOff > 0) {
                                                                            setSelectedGradeData({
                                                                                name: `Siswa Out (ON CAMPUS) — ${row.label}`,
                                                                                grade: `Siswa Out (ON CAMPUS) — ${row.label}`,
                                                                                count: stoppedOff,
                                                                                student_list: row.stopped_students?.offline || [],
                                                                                is_stopped: true,
                                                                            });
                                                                            setSearchStudentInModal('');
                                                                        }
                                                                    }}
                                                                    title={stoppedOff > 0 ? `Klik untuk melihat ${stoppedOff} siswa stop` : ''}
                                                                >
                                                                    {stoppedOff}
                                                                </td>
                                                                <td 
                                                                    className={`px-4 py-3 text-center text-xs font-bold bg-rose-50/40 border-r border-slate-200 ${stoppedOn > 0 ? 'text-rose-600 hover:bg-rose-100/70 cursor-pointer font-black underline decoration-rose-300' : 'text-slate-300'}`}
                                                                    onClick={() => {
                                                                        if (stoppedOn > 0) {
                                                                            setSelectedGradeData({
                                                                                name: `Siswa Out (ONLINE) — ${row.label}`,
                                                                                grade: `Siswa Out (ONLINE) — ${row.label}`,
                                                                                count: stoppedOn,
                                                                                student_list: row.stopped_students?.online || [],
                                                                                is_stopped: true,
                                                                            });
                                                                            setSearchStudentInModal('');
                                                                        }
                                                                    }}
                                                                    title={stoppedOn > 0 ? `Klik untuk melihat ${stoppedOn} siswa stop` : ''}
                                                                >
                                                                    {stoppedOn}
                                                                </td>
                                                                {/* Total Cells (Siswa In) */}
                                                                <td 
                                                                    className={`px-4 py-3 text-center text-xs font-black bg-emerald-50/40 ${rowOffline > 0 ? 'text-emerald-800 hover:bg-emerald-100 cursor-pointer underline decoration-emerald-400' : 'text-slate-300'}`}
                                                                    onClick={() => {
                                                                        if (rowOffline > 0) {
                                                                            const allCampusIn = package_list.flatMap(p => row.package_students?.[p]?.offline || []);
                                                                            setSelectedGradeData({
                                                                                grade: `Total Siswa In (ON CAMPUS) — ${row.label}`,
                                                                                count: rowOffline,
                                                                                student_list: allCampusIn,
                                                                            });
                                                                            setSearchStudentInModal('');
                                                                        }
                                                                    }}
                                                                    title={rowOffline > 0 ? `Klik untuk melihat ${rowOffline} siswa` : ''}
                                                                >
                                                                    {rowOffline}
                                                                </td>
                                                                <td 
                                                                    className={`px-4 py-3 text-center text-xs font-black bg-indigo-50/40 border-r border-slate-200 ${rowOnline > 0 ? 'text-indigo-800 hover:bg-indigo-100 cursor-pointer underline decoration-indigo-400' : 'text-slate-300'}`}
                                                                    onClick={() => {
                                                                        if (rowOnline > 0) {
                                                                            const allOnlineIn = package_list.flatMap(p => row.package_students?.[p]?.online || []);
                                                                            setSelectedGradeData({
                                                                                grade: `Total Siswa In (ONLINE) — ${row.label}`,
                                                                                count: rowOnline,
                                                                                student_list: allOnlineIn,
                                                                            });
                                                                            setSearchStudentInModal('');
                                                                        }
                                                                    }}
                                                                    title={rowOnline > 0 ? `Klik untuk melihat ${rowOnline} siswa` : ''}
                                                                >
                                                                    {rowOnline}
                                                                </td>
                                                                {/* Total Students Cell (from branch_monthly_student_snapshots) */}
                                                                <td className={`px-6 py-3 text-center text-xs font-black bg-indigo-50/60 border-l border-slate-200 ${totStudents > 0 ? 'text-indigo-900' : 'text-slate-300'}`}>
                                                                    {totStudents}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>

                                                {/* Total Row */}
                                                <tfoot>
                                                    <tr className="bg-slate-800 border-t-2 border-slate-300">
                                                        <td className="sticky left-0 z-10 bg-slate-800 px-6 py-4 text-[10px] font-black text-white uppercase tracking-[0.2em] border-r border-slate-600">
                                                            Total
                                                        </td>
                                                        {package_list.map((pkg) => (
                                                            <>
                                                                <td key={`tot-${pkg}-c`} className="px-4 py-4 text-center text-xs font-black text-emerald-300 border-r border-slate-700">
                                                                    {totals[pkg]?.offline ?? 0}
                                                                </td>
                                                                <td key={`tot-${pkg}-o`} className="px-4 py-4 text-center text-xs font-black text-indigo-300 border-r border-slate-600">
                                                                    {totals[pkg]?.online ?? 0}
                                                                </td>
                                                            </>
                                                        ))}
                                                        {/* Siswa Out Totals */}
                                                        <td className="px-4 py-4 text-center text-xs font-black text-rose-300 bg-rose-900/30 border-r border-slate-700">
                                                            {stoppedTotals.offline}
                                                        </td>
                                                        <td className="px-4 py-4 text-center text-xs font-black text-rose-300 bg-rose-900/30 border-r border-slate-600">
                                                            {stoppedTotals.online}
                                                        </td>
                                                        {/* Total In */}
                                                        <td className="px-4 py-4 text-center text-xs font-black text-emerald-200 bg-emerald-900/30">
                                                            {grandOffline}
                                                        </td>
                                                        <td className="px-4 py-4 text-center text-xs font-black text-indigo-200 bg-indigo-900/30 border-r border-slate-600">
                                                            {grandOnline}
                                                        </td>
                                                        {/* Total Students Sum (point-in-time snapshot, not additive) */}
                                                        <td className="px-6 py-4 text-center text-xs font-black text-slate-400 bg-indigo-950/60 border-l border-slate-600">
                                                            -
                                                        </td>
                                                    </tr>

                                                    {/* Average Row */}
                                                    <tr className="bg-slate-700 border-t border-slate-600">
                                                        <td className="sticky left-0 z-10 bg-slate-700 px-6 py-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-r border-slate-600">
                                                            Avg / Bulan
                                                        </td>
                                                        {package_list.map((pkg) => (
                                                            <>
                                                                <td key={`avg-${pkg}-c`} className="px-4 py-3 text-center text-[10px] font-black text-emerald-400 border-r border-slate-700">
                                                                    {Math.round((totals[pkg]?.offline ?? 0) / avgCount)}
                                                                </td>
                                                                <td key={`avg-${pkg}-o`} className="px-4 py-3 text-center text-[10px] font-black text-indigo-400 border-r border-slate-600">
                                                                    {Math.round((totals[pkg]?.online ?? 0) / avgCount)}
                                                                </td>
                                                            </>
                                                        ))}
                                                        {/* Siswa Out Averages */}
                                                        <td className="px-4 py-3 text-center text-[10px] font-black text-rose-300 bg-rose-900/20 border-r border-slate-700">
                                                            {Math.round((stoppedTotals.offline) / avgCount)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[10px] font-black text-rose-300 bg-rose-900/20 border-r border-slate-600">
                                                            {Math.round((stoppedTotals.online) / avgCount)}
                                                        </td>
                                                        {/* Total Averages */}
                                                        <td className="px-4 py-3 text-center text-[10px] font-black text-emerald-300 bg-emerald-900/20">
                                                            {Math.round(grandOffline / avgCount)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[10px] font-black text-indigo-300 bg-indigo-900/20 border-r border-slate-600">
                                                            {Math.round(grandOnline / avgCount)}
                                                        </td>
                                                        {/* Total Students Average */}
                                                        <td className="px-6 py-3 text-center text-[10px] font-black text-amber-300 bg-indigo-950/40 border-l border-slate-600">
                                                            {Math.round(months.reduce((sum, m) => sum + (m.total_students ?? 0), 0) / avgCount)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center gap-4">
                                    <Laptop className="w-12 h-12 text-slate-300" />
                                    <p className="text-sm font-bold text-slate-400">
                                        Tidak ada data pola join untuk tahun {year}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })()}



                {/* ═══════════════════════════════════════════════════
                    TAB: SISWA STOP
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'siswa_stop' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="space-y-3">
                            <FilterBar showMonth={true} />
                            <div className="flex items-center justify-end">
                                <ExportDropdown buildExportUrl={buildExportUrl} type="stop" />
                            </div>
                        </div>

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
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Tren Siswa Stop per Bulan</h4>
                                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Klik pada batang bulan untuk melihat rincian siswa stop</p>
                                </div>
                                <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 border border-rose-100 px-3 py-1 rounded-lg">Tahun {year}</span>
                            </div>
                            {siswa_stop.monthly_trend.length > 0 ? (
                                <div className="h-96 w-full cursor-pointer select-none">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={siswa_stop.monthly_trend} 
                                            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                                            onClick={(e) => {
                                                if (e && e.activePayload && e.activePayload.length > 0) {
                                                    const p = e.activePayload[0].payload;
                                                    setSelectedGradeData({
                                                        ...p,
                                                        name: `Daftar Siswa Stop — ${p.month}`,
                                                        count: p.stopped || p.count || 0,
                                                        is_stopped: true,
                                                    });
                                                    setSearchStudentInModal('');
                                                }
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                            <YAxis tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                            <Tooltip 
                                                cursor={{ fill: 'rgba(244, 63, 94, 0.08)' }}
                                                wrapperStyle={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedGradeData({
                                                                        ...data,
                                                                        name: `Daftar Siswa Stop — ${data.month}`,
                                                                        count: data.stopped || data.count || 0,
                                                                        is_stopped: true,
                                                                    });
                                                                    setSearchStudentInModal('');
                                                                }}
                                                                className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-semibold space-y-1 cursor-pointer hover:bg-slate-800 transition-colors"
                                                            >
                                                                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Periode {data.month}</div>
                                                                <div className="flex items-center justify-between gap-3 text-white">
                                                                    <span>Siswa Stop:</span>
                                                                    <span className="font-black text-rose-400 text-sm">{data.stopped} Siswa</span>
                                                                </div>
                                                                <div className="text-[10px] text-rose-300 font-medium pt-1 border-t border-slate-800 flex items-center gap-1">
                                                                    <span>👉 Klik untuk rincian siswa stop</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar 
                                                dataKey="stopped" 
                                                name="Siswa Stop" 
                                                fill="#f43f5e" 
                                                radius={[6, 6, 0, 0]} 
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={(data) => {
                                                    if (data) {
                                                        setSelectedGradeData({
                                                            ...data,
                                                            name: `Daftar Siswa Stop — ${data.month}`,
                                                            count: data.stopped || data.count || 0,
                                                            is_stopped: true,
                                                        });
                                                        setSearchStudentInModal('');
                                                    }
                                                }}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-96 flex items-center justify-center text-slate-400 text-sm font-bold">
                                    Tidak ada data siswa stop untuk tahun {year}
                                </div>
                            )}
                        </div>

                        {/* Stopped Students Table with Notes */}
                        <div className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-rose-500" />
                                        Rincian Siswa Stop &amp; Catatan Alasan
                                    </h4>
                                    <p className="text-[11px] font-semibold text-slate-450 mt-0.5">
                                        Daftar siswa berstatus stop beserta keterangan catatan alasan berhenti
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-64">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama, cabang, catatan..."
                                            value={searchStoppedTable}
                                            onChange={(e) => setSearchStoppedTable(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl whitespace-nowrap">
                                        {siswa_stop?.students?.length || 0} Siswa
                                    </span>
                                </div>
                            </div>

                            {(() => {
                                const studentList = siswa_stop?.students || [];
                                const filtered = studentList.filter((s) => {
                                    if (!searchStoppedTable) return true;
                                    const q = searchStoppedTable.toLowerCase();
                                    return (
                                        (s.name && s.name.toLowerCase().includes(q)) ||
                                        (s.student_number && s.student_number.toLowerCase().includes(q)) ||
                                        (s.phone && s.phone.toLowerCase().includes(q)) ||
                                        (s.school && s.school.toLowerCase().includes(q)) ||
                                        (s.branch_name && s.branch_name.toLowerCase().includes(q)) ||
                                        (s.class_name && s.class_name.toLowerCase().includes(q)) ||
                                        (s.notes && s.notes.toLowerCase().includes(q))
                                    );
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                                            {searchStoppedTable 
                                                ? `Tidak ada siswa stop yang cocok dengan "${searchStoppedTable}"`
                                                : `Tidak ada data siswa stop untuk periode tahun ${year}`}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                                                <tr>
                                                    <th className="py-3 px-4 w-12 text-center">No</th>
                                                    <th className="py-3 px-4">Siswa</th>
                                                    <th className="py-3 px-4">Cabang</th>
                                                    <th className="py-3 px-4">Mode</th>
                                                    <th className="py-3 px-4">Tingkat / Sekolah</th>
                                                    <th className="py-3 px-4 whitespace-nowrap">Tgl Berhenti</th>
                                                    <th className="py-3 px-4">Catatan / Alasan Berhenti</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                {filtered.map((s, idx) => (
                                                    <tr key={s.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-3 px-4 text-center text-[11px] font-bold text-slate-400">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {renderStudentAvatar(s)}
                                                                <div>
                                                                    <div className="font-black text-slate-900">{s.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold">{s.student_number || s.phone || '-'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                {s.branch_name || 'Central'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                                s.delivery_mode === 'online' 
                                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                            }`}>
                                                                {s.delivery_mode === 'online' ? 'Online' : 'On Campus'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-slate-800">{s.school || '-'}</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold">
                                                                {[s.grade, s.class_name].filter(Boolean).join(' • ')}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                                                            {formatIndonesianDate(s.stopped_at)}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {s.notes && !s.notes.startsWith('NIK:') ? (
                                                                <div className="inline-flex items-start gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200/90 max-w-md shadow-xs">
                                                                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                                    <span className="break-words">{s.notes}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-400 italic">Tanpa catatan</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB: TINGKAT PENDIDIKAN
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'grades' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="space-y-3">
                            <FilterBar showMonth={true} />
                            <div className="flex justify-end">
                                <ExportButtons
                                    onPdf={buildExportUrl('pdf', 'grades')}
                                    onExcel={buildExportUrl('excel', 'grades')}
                                    label="Tingkat Pendidikan"
                                    size="sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Segmentasi Demografi Tingkat Sekolah</h4>
                                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Klik pada batang jenjang untuk melihat rincian siswa</p>
                                    </div>
                                    <span className="text-[10px] font-black text-purple-600 uppercase bg-purple-50 border border-purple-100 px-3 py-1 rounded-lg">
                                        Total {grades?.reduce((acc, g) => acc + (g.count || 0), 0) || 0} Siswa
                                    </span>
                                </div>
                                {grades.some(g => g.count > 0) ? (
                                    <div className="h-96 w-full cursor-pointer select-none">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={grades} 
                                                layout="vertical" 
                                                margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                                                onClick={(e) => {
                                                    if (e && e.activePayload && e.activePayload.length > 0) {
                                                        const p = e.activePayload[0].payload;
                                                        setSelectedGradeData(p);
                                                        setSearchStudentInModal('');
                                                    }
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                                <Tooltip 
                                                    cursor={false}
                                                    wrapperStyle={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedGradeData(data);
                                                                        setSearchStudentInModal('');
                                                                    }}
                                                                    className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-semibold space-y-1 cursor-pointer hover:bg-slate-800 transition-colors"
                                                                >
                                                                    <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Jenjang {data.name}</div>
                                                                    <div className="flex items-center justify-between gap-3 text-white">
                                                                        <span>Jumlah Siswa:</span>
                                                                        <span className="font-black text-purple-400 text-sm">{data.count} Siswa</span>
                                                                    </div>
                                                                    <div className="text-[10px] text-purple-300 font-medium pt-1 border-t border-slate-800 flex items-center gap-1">
                                                                        <span>👉 Klik untuk rincian siswa</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar 
                                                    dataKey="count" 
                                                    name="Siswa Aktif" 
                                                    fill="#8b5cf6" 
                                                    radius={[0, 8, 8, 0]}
                                                    className="cursor-pointer"
                                                    onClick={(data) => {
                                                        if (data) {
                                                            setSelectedGradeData(data);
                                                            setSearchStudentInModal('');
                                                        }
                                                    }}
                                                >
                                                    {grades.map((entry, index) => (
                                                        <Cell 
                                                            key={`cell-${index}`} 
                                                            fill={COLORS[index % COLORS.length]} 
                                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => {
                                                                setSelectedGradeData(entry);
                                                                setSearchStudentInModal('');
                                                            }}
                                                        />
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
                                        <button
                                            key={item.name} 
                                            type="button"
                                            onClick={() => {
                                                setSelectedGradeData(item);
                                                setSearchStudentInModal('');
                                            }}
                                            className="w-full flex items-center justify-between text-xs border border-slate-100/80 hover:border-purple-200 bg-slate-50/40 hover:bg-purple-50/30 p-2.5 rounded-xl transition-all duration-200 cursor-pointer text-left"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                <span className="font-bold text-slate-700">Jenjang {item.name}</span>
                                            </div>
                                            <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-2xs">
                                                {item.count} siswa &rarr;
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════
                    TAB: RIWAYAT PINDAH KELAS (CLASS TRANSFERS)
                ═══════════════════════════════════════════════════ */}
                {activeTab === 'class_transfers' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="space-y-3">
                            <FilterBar showMonth={true} showMode={false} />
                            <div className="flex justify-end items-center gap-3 flex-wrap">
                                <ExportButtons
                                    onPdf={buildExportUrl('pdf', 'class_transfers')}
                                    onExcel={buildExportUrl('excel', 'class_transfers')}
                                    label="Riwayat Pindah Kelas"
                                    size="sm"
                                />
                            </div>
                        </div>

                        {/* Top Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Total Siswa Pindah */}
                            <div className="bg-gradient-to-br from-red-50/60 to-red-100/30 border border-red-100/70 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-[80px] group-hover:scale-110 transition-transform duration-500" />
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-red-600/20">
                                        <ArrowRightLeft className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Total Mutasi / Pindah Kelas
                                    </p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none flex items-baseline gap-2">
                                        {formatNumber(class_transfers?.total_transfers || 0)}
                                        <span className="text-xs font-bold text-slate-400">transaksi</span>
                                    </h3>
                                </div>
                            </div>

                            {/* Periode Filter */}
                            <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/40 border border-slate-200/70 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md shadow-slate-800/20">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Periode Terpilih
                                    </p>
                                    <h3 className="text-xl font-black text-slate-800 leading-none">
                                        {month ? `${MONTH_NAMES[month - 1]} ${year}` : `Tahun ${year}`}
                                    </h3>
                                </div>
                            </div>

                            {/* Info Keterangan */}
                            <div className="bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 border border-emerald-100/70 rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Cabang Terfilter
                                    </p>
                                    <h3 className="text-xl font-black text-slate-800 leading-none">
                                        {branch_id ? (available_branches?.find(b => String(b.id) === String(branch_id))?.name || 'Cabang') : 'Semua Cabang'}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Search & Table List */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4 text-red-500" />
                                        Log Riwayat Pindah Kelas
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                                        Daftar seluruh transaksi siswa yang dipindahkan antar kelas
                                    </p>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Cari siswa, kelas, alasan..."
                                        value={searchTransfersTable}
                                        onChange={(e) => setSearchTransfersTable(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-100">
                                            <th className="py-3 px-4 w-12 text-center">No</th>
                                            <th className="py-3 px-4">Siswa</th>
                                            <th className="py-3 px-4">Cabang</th>
                                            <th className="py-3 px-4">Perpindahan Kelas</th>
                                            <th className="py-3 px-4">Tgl Efektif</th>
                                            <th className="py-3 px-4">Alasan &amp; Petugas</th>
                                            <th className="py-3 px-4 text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-normal">
                                        {(() => {
                                            const allTransfers = class_transfers?.transfers || [];
                                            const filtered = allTransfers.filter(item => {
                                                if (!searchTransfersTable) return true;
                                                const q = searchTransfersTable.toLowerCase();
                                                return (
                                                    (item.name && item.name.toLowerCase().includes(q)) ||
                                                    (item.student_number && item.student_number.toLowerCase().includes(q)) ||
                                                    (item.from_class_name && item.from_class_name.toLowerCase().includes(q)) ||
                                                    (item.to_class_name && item.to_class_name.toLowerCase().includes(q)) ||
                                                    (item.reason && item.reason.toLowerCase().includes(q)) ||
                                                    (item.causer_name && item.causer_name.toLowerCase().includes(q)) ||
                                                    (item.branch_name && item.branch_name.toLowerCase().includes(q))
                                                );
                                            });

                                            if (filtered.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                                                            <ArrowRightLeft className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                            Tidak ada data riwayat perpindahan kelas pada filter ini
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filtered.map((item, idx) => (
                                                <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            {renderStudentAvatar(item, 'sm')}
                                                            <div>
                                                                <div className="font-bold text-slate-900 leading-snug">
                                                                    {item.name}
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-400 tracking-wider">
                                                                    {item.student_number} • {item.phone || '-'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                                                            {item.branch_name}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-red-50 text-red-700 border border-red-100">
                                                                {item.from_class_name}
                                                            </span>
                                                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                {item.to_class_name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-bold text-slate-700 whitespace-nowrap">
                                                        {item.effective_date}
                                                    </td>
                                                    <td className="py-3.5 px-4 max-w-xs">
                                                        {item.reason && item.reason !== '-' ? (
                                                            <div className="inline-flex items-start gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-50 text-slate-800 border border-slate-200">
                                                                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                                <span className="break-words">{item.reason}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 italic">Tanpa catatan</span>
                                                        )}
                                                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                            Oleh: <span className="text-slate-600 font-bold">{item.causer_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right text-[11px] text-slate-400 font-medium whitespace-nowrap">
                                                        {item.created_at}
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
            {/* Modal Detail Siswa yang Bergabung pada Bulan Terpilih */}
            {selectedMonthData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn">
                        {/* Modal Header */}
                        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        Daftar Siswa Bergabung — {selectedMonthData.month}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-450 mt-0.5">
                                        Total <span className="text-indigo-600 font-bold">{selectedMonthData.students} siswa</span> terdaftar mulai join pada periode ini
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedMonthData(null)}
                                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Search Bar */}
                        <div className="p-4 px-6 border-b border-slate-100 bg-white">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama siswa, ID, sekolah, atau cabang..."
                                    value={searchStudentInModal}
                                    onChange={(e) => setSearchStudentInModal(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Modal Student Table / List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {(() => {
                                const list = selectedMonthData.student_list || [];
                                const filtered = list.filter((s) => {
                                    if (!searchStudentInModal) return true;
                                    const q = searchStudentInModal.toLowerCase();
                                    return (
                                        (s.name && s.name.toLowerCase().includes(q)) ||
                                        (s.student_number && s.student_number.toLowerCase().includes(q)) ||
                                        (s.school && s.school.toLowerCase().includes(q)) ||
                                        (s.branch && s.branch.toLowerCase().includes(q))
                                    );
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                                            Tidak ada siswa yang cocok dengan pencarian "{searchStudentInModal}"
                                        </div>
                                    );
                                }

                                return (
                                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                                                <tr>
                                                    <th className="py-3 px-4">Siswa</th>
                                                    <th className="py-3 px-4">Cabang</th>
                                                    <th className="py-3 px-4">Tingkat / Sekolah</th>
                                                    <th className="py-3 px-4">Tgl Join</th>
                                                    <th className="py-3 px-4">Tier / Paket</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                {filtered.map((student, idx) => (
                                                    <tr key={student.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {renderStudentAvatar(student)}
                                                                <div>
                                                                    <div className="font-black text-slate-900">{student.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold">{student.student_number || student.phone || '-'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                {student.branch || 'SOLO'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div>{student.school || '-'}</div>
                                                            <div className="text-[10px] text-slate-400">{student.grade || ''}</div>
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-semibold">
                                                            {student.start_join}
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap">
                                                            {student.loyalty_tier ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                                                    🏆 {student.loyalty_tier}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                                    {student.rejoin_count ? `${student.rejoin_count} Paket` : '0 Paket'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedMonthData(null)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Siswa Berdasarkan Tingkat Pendidikan / Pola Join / Siswa Stop */}
            {selectedGradeData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-scaleIn">
                        {/* Modal Header */}
                        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                                    selectedGradeData.is_stopped ? 'bg-rose-50 text-rose-600' : 'bg-purple-50 text-purple-600'
                                }`}>
                                    {selectedGradeData.is_stopped ? <ShieldAlert className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        {selectedGradeData.name || selectedGradeData.grade}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-450 mt-0.5">
                                        Total <span className={`${selectedGradeData.is_stopped ? 'text-rose-600' : 'text-purple-600'} font-bold`}>{selectedGradeData.count} siswa</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedGradeData(null)}
                                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Search Bar */}
                        <div className="p-4 px-6 border-b border-slate-100 bg-white">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cari nama siswa, ID, nomor HP, sekolah, cabang, atau catatan..."
                                    value={searchStudentInModal}
                                    onChange={(e) => setSearchStudentInModal(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Modal Student Table / List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {(() => {
                                const list = selectedGradeData.student_list || [];
                                const filtered = list.filter((s) => {
                                    if (!searchStudentInModal) return true;
                                    const q = searchStudentInModal.toLowerCase();
                                    return (
                                        (s.name && s.name.toLowerCase().includes(q)) ||
                                        (s.student_number && s.student_number.toLowerCase().includes(q)) ||
                                        (s.phone && s.phone.toLowerCase().includes(q)) ||
                                        (s.school && s.school.toLowerCase().includes(q)) ||
                                        (s.branch && s.branch.toLowerCase().includes(q)) ||
                                        (s.branch_name && s.branch_name.toLowerCase().includes(q)) ||
                                        (s.class_name && s.class_name.toLowerCase().includes(q)) ||
                                        (s.notes && s.notes.toLowerCase().includes(q))
                                    );
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                                            Tidak ada siswa yang cocok dengan pencarian "{searchStudentInModal}"
                                        </div>
                                    );
                                }

                                return (
                                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                                                <tr>
                                                    <th className="py-3 px-4">Siswa</th>
                                                    <th className="py-3 px-4">Cabang</th>
                                                    <th className="py-3 px-4">Tingkat / Sekolah</th>
                                                    <th className="py-3 px-4 whitespace-nowrap">{selectedGradeData.is_stopped ? 'Tgl Berhenti' : 'Tgl Join'}</th>
                                                    <th className="py-3 px-4">{selectedGradeData.is_stopped ? 'Catatan / Alasan Stop' : 'Tier / Paket'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                                {filtered.map((student, idx) => (
                                                    <tr key={student.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {renderStudentAvatar(student)}
                                                                <div>
                                                                    <div className="font-black text-slate-900">{student.name}</div>
                                                                    <div className="text-[10px] text-slate-400 font-bold">{student.student_number || student.phone || '-'}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                {student.branch_name || student.branch || 'Central'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="font-bold text-slate-800">{student.school || '-'}</div>
                                                            <div className="text-[10px] text-slate-400 font-semibold">
                                                                {[student.grade, student.class_name].filter(Boolean).join(' • ')}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                                                            {student.stopped_at ? (
                                                                <span>{formatIndonesianDate(student.stopped_at)}</span>
                                                            ) : (
                                                                <span className="text-slate-500">{formatIndonesianDate(student.start_join || student.joined_at)}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {selectedGradeData.is_stopped ? (
                                                                student.notes && !student.notes.startsWith('NIK:') ? (
                                                                    <div className="inline-flex items-start gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-50 text-slate-800 border border-slate-200 max-w-sm">
                                                                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                                        <span className="break-words">{student.notes}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[11px] text-slate-400 italic">Tanpa catatan</span>
                                                                )
                                                            ) : student.notes && !student.notes.startsWith('NIK:') ? (
                                                                <div className="inline-flex items-start gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-50 text-slate-800 border border-slate-200 max-w-sm">
                                                                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                                    <span className="break-words">{student.notes}</span>
                                                                </div>
                                                            ) : student.loyalty_tier ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                                                    🏆 {student.loyalty_tier}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                                    {student.rejoin_count ? `${student.rejoin_count} Paket` : '0 Paket'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => setSelectedGradeData(null)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                MODAL LIGHTBOX PREVIEW FOTO SISWA
            ═══════════════════════════════════════════════════ */}
            {previewPhoto && (
                <div 
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div 
                        className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-scaleIn"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal Preview */}
                        <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div>
                                <h4 className="text-sm font-black text-slate-900">{previewPhoto.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {previewPhoto.student_number} {previewPhoto.branch && `• ${previewPhoto.branch}`}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewPhoto(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Foto Preview */}
                        <div className="p-6 flex flex-col items-center justify-center bg-slate-900/5">
                            <div className="w-56 h-56 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-white flex items-center justify-center">
                                <img 
                                    src={previewPhoto.photo_url} 
                                    alt={previewPhoto.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {previewPhoto.is_custom_photo ? (
                                <span className="mt-3 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                                    Foto Profil Siswa
                                </span>
                            ) : (
                                <span className="mt-3 text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    Avatar Default Siswa
                                </span>
                            )}
                        </div>

                        {/* Footer Modal Preview */}
                        <div className="p-3 px-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setPreviewPhoto(null)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Tutup
                            </button>
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
