import React, { useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { 
    TrendingUp, DollarSign, Clock, Tag, 
    Percent, BarChart3, Users, BookOpen, AlertCircle
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

export default function Index({ stats }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate percentage breakdown for Student Type
    const studentTypeBreakdown = useMemo(() => {
        const total = stats.new_join_revenue + stats.rejoin_revenue;
        if (total === 0) return { newPercent: 0, rejoinPercent: 0 };
        return {
            newPercent: Math.round((stats.new_join_revenue / total) * 100),
            rejoinPercent: Math.round((stats.rejoin_revenue / total) * 100),
        };
    }, [stats]);

    return (
        <AuthenticatedLayout>
            <Head title="Laporan Keuangan" />

            <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Laporan <span className="text-red-600">Keuangan</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Ringkasan performa pendapatan, trend, dan analisis produk
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Revenue */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-[80px] -z-10 group-hover:scale-110 transition-transform"></div>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pendapatan (Lunas)</span>
                                <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-1">{formatCurrency(stats.total_revenue)}</h3>
                            </div>
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                <DollarSign size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Outstanding Receivables */}
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

                    {/* Total Discount Given */}
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

                    {/* Average Transaction Value */}
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
                        {/* New Join vs Rejoin Breakdown */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tipe Pendaftaran</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Proporsi New Join vs Rejoin</p>
                            </div>

                            <div className="space-y-4">
                                {/* New Join */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                                            New Join
                                        </span>
                                        <span className="font-black text-slate-900">{studentTypeBreakdown.newPercent}% ({formatCurrency(stats.new_join_revenue)})</span>
                                    </div>
                                    <div className="w-full h-3.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${studentTypeBreakdown.newPercent}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Rejoin */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 bg-violet-500 rounded-full"></span>
                                            Rejoin Student
                                        </span>
                                        <span className="font-black text-slate-900">{studentTypeBreakdown.rejoinPercent}% ({formatCurrency(stats.rejoin_revenue)})</span>
                                    </div>
                                    <div className="w-full h-3.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                                            style={{ width: `${studentTypeBreakdown.rejoinPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Classes by Revenue */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Top Kelas / Produk</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Penghasil kontribusi terbesar</p>
                            </div>

                            <div className="space-y-4">
                                {stats.class_revenue.length > 0 ? stats.class_revenue.map((cls, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-4 p-3 hover:bg-slate-50/50 rounded-2xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-50 flex items-center justify-center rounded-xl text-red-500 font-black text-xs">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{cls.class_name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{cls.count} Transaksi</p>
                                            </div>
                                        </div>
                                        <p className="text-xs font-black text-slate-800">{formatCurrency(cls.total)}</p>
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-slate-400 italic text-xs font-bold uppercase flex flex-col items-center gap-2">
                                        <AlertCircle size={20} className="text-slate-300" />
                                        Belum ada data transaksi kelas
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
