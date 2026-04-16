import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from '../partials/CrmLayout';
import LeadsReport from '../partials/LeadsReport';
import { Filter, Calendar, MapPin } from 'lucide-react';

export default function Index({ leads, filters, branches, sources, phases, monthlyGoal, insights, newLeadsCount, enrolledLeadsCount, successRates }) {
    const { auth } = usePage().props;
    const isSuperadmin = auth.user.role === 'superadmin' || !!auth.user.superadmin;
    
    const handleFilterChange = (key, value) => {
        router.get(route('admin.crm.reports.index'), {
            ...filters,
            [key]: value
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const handleDownloadPdf = () => {
        const queryParams = new URLSearchParams(filters).toString();
        window.open(route('admin.crm.reports.download') + '?' + queryParams, '_blank');
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <AuthenticatedLayout>
            <Head title="CRM Reports" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout>
                    <div className="space-y-10">
                        {/* Report Type Selector */}
                        <div className="flex gap-4 p-1 bg-gray-100/50 rounded-2xl w-fit">
                            <button 
                                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white shadow-sm text-red-600"
                            >
                                Monthly Analytics
                            </button>
                            <button 
                                onClick={() => router.get(route('admin.crm.reports.daily'))}
                                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/50 text-gray-500"
                            >
                                {isSuperadmin ? "Daily Operational Report" : "My Daily Performance"}
                            </button>
                        </div>

                        {/* Filters Bar for Reports */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl">
                                <Filter size={16} className="text-gray-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Apply Filters</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" />
                                <select 
                                    value={filters.branch_id || 'all'}
                                    onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                    className="border-0 bg-transparent text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer pr-8"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.data.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <select 
                                    value={filters.month || new Date().getMonth() + 1}
                                    onChange={(e) => handleFilterChange('month', e.target.value)}
                                    className="border-0 bg-transparent text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer pr-8"
                                >
                                    {months.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <select 
                                    value={filters.year || new Date().getFullYear()}
                                    onChange={(e) => handleFilterChange('year', e.target.value)}
                                    className="border-0 bg-transparent text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer pr-8"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ml-auto">
                                <button 
                                    onClick={handleDownloadPdf}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-gray-200"
                                >
                                    Download PDF Report
                                </button>
                            </div>
                        </div>

                        {/* Rendering the Report Partial */}
                        <LeadsReport 
                            leads={leads}
                            sources={sources.data}
                            phases={phases.data}
                            branches={branches.data}
                            insights={insights}
                            newLeadsCount={newLeadsCount}
                            enrolledLeadsCount={enrolledLeadsCount}
                            successRates={successRates}
                        />
                    </div>
                </CrmLayout>
            </div>
        </AuthenticatedLayout>
    );
}
