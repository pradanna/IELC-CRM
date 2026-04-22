import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from '../partials/CrmLayout';
import { Filter, Calendar, MapPin, MessageSquare, FileText, UserPlus, Printer } from 'lucide-react';

export default function Daily({ newLeads = [], enrollments = [], activities, ptSessions, registrations, branches, filters }) {
    const { auth } = usePage().props;
    const isSuperadmin = ['superadmin', 'frontdesk', 'marketing'].includes(auth.user.role) || !!auth.user.superadmin;
    const dailyLabel = isSuperadmin ? "Daily Operational Report" : "My Daily Performance";

    const handleFilterChange = (key, value) => {
        router.get(route('admin.crm.reports.daily'), {
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
        window.open(route('admin.crm.reports.daily.download') + '?' + queryParams, '_blank');
    };

    const handleDownloadWord = () => {
        const queryParams = new URLSearchParams(filters).toString();
        window.open(route('admin.crm.reports.daily.word') + '?' + queryParams, '_blank');
    };

    const Card = ({ children, className = "" }) => (
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title={dailyLabel} />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout>
                    <div className="space-y-8">
                        {/* Report Type Selector */}
                        <div className="flex gap-4 p-1 bg-gray-100/50 rounded-2xl w-fit">
                            <button 
                                onClick={() => router.get(route('admin.crm.reports.index'))}
                                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/50 text-gray-500"
                            >
                                Monthly Analytics
                            </button>
                            <button 
                                className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white shadow-sm text-red-600"
                            >
                                {dailyLabel}
                            </button>
                        </div>

                        {/* Header & Filters */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex flex-wrap items-center gap-4 bg-white p-2 pl-4 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
                                    <Calendar size={16} className="text-gray-400" />
                                    <input 
                                        type="date" 
                                        value={filters.date}
                                        onChange={(e) => handleFilterChange('date', e.target.value)}
                                        className="border-0 bg-transparent text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer"
                                    />
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
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleDownloadWord}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-slate-900 border border-gray-200 px-6 py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-sm"
                                >
                                    <FileText size={16} />
                                    Export to Word (.doc)
                                </button>
                                <button 
                                    onClick={handleDownloadPdf}
                                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-gray-200"
                                >
                                    <Printer size={16} />
                                    Print Daily Report (PDF)
                                </button>
                            </div>
                        </div>

                        {/* Top Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-sky-500">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Incoming Leads</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">{newLeads.length}</p>
                            </Card>
                            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-emerald-500">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Enrollments</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">{enrollments.length}</p>
                            </Card>
                            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-blue-500">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Activities</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">{activities.length}</p>
                            </Card>
                            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-amber-500">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">PT Taken</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">{ptSessions.length}</p>
                            </Card>
                            <Card className="p-5 flex flex-col justify-center border-l-4 border-l-indigo-500">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Registrations</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">{registrations.length}</p>
                            </Card>
                        </div>

                        {/* Detail Tables */}
                        <div className="grid grid-cols-1 gap-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* New Leads Table */}
                                <Card>
                                    <div className="px-6 py-5 border-b border-gray-50 bg-sky-50/50">
                                        <h3 className="text-xs font-black text-sky-900 uppercase tracking-widest text-center">
                                            {isSuperadmin ? "Incoming Today (New Leads)" : "My Acquisition Today"}
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/20">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Lead</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Source</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {newLeads.length > 0 ? newLeads.map((ld) => (
                                                    <tr key={ld.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-900 text-sm">{ld.name}</div>
                                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                                                <span>{ld.lead_number}</span>
                                                                <span>•</span>
                                                                <span>{ld.branch?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[10px] font-black uppercase text-gray-600 bg-gray-100 px-2 py-1 rounded-md w-fit mb-1">{ld.lead_source?.name || 'Manual'}</div>
                                                            <div className="text-[10px] font-bold text-gray-400">{ld.phone}</div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-400 font-medium">No new leads today.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* Enrollments Table */}
                                <Card>
                                    <div className="px-6 py-5 border-b border-gray-50 bg-emerald-50/50">
                                        <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest text-center">
                                            {isSuperadmin ? "Officially Enrolled Today" : "My Closing Records"}
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/20">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Student</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Plotting</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {enrollments.length > 0 ? enrollments.map((enr) => (
                                                    <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-900 text-sm">{enr.name}</div>
                                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                                                <span>{enr.lead_number}</span>
                                                                <span>•</span>
                                                                <span>{enr.branch?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 italic">ENROLLED</span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-400 font-medium">No students enrolled today.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                            {/* Activity Table */}
                            <Card>
                                <div className="px-6 py-5 border-b border-gray-50 bg-slate-50/50">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest text-center">
                                        {isSuperadmin ? "Recent Frontdesk Activities" : "My Logs & Activities"}
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/20">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Lead Name</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Staff</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Activity</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {activities.length > 0 ? activities.map((act) => (
                                                <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900">{act.lead?.name || 'Unknown'}</div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                                                            <span>{act.lead?.lead_number}</span>
                                                            <span>•</span>
                                                            <span>{act.lead?.branch?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{act.user?.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                            act.type === 'call' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                                                        }`}>
                                                            {act.type}
                                                        </span>
                                                        <p className="mt-1 text-xs text-gray-500 line-clamp-1">{act.description}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-400">
                                                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-400 font-medium">No activity recorded today.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* PT Results Table */}
                                <Card>
                                    <div className="px-6 py-5 border-b border-gray-50 bg-slate-50/50">
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Placement Test Results</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/20">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Student</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Exam</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Score</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {ptSessions.length > 0 ? ptSessions.map((pt) => (
                                                    <tr key={pt.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-900">{pt.lead?.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{pt.lead?.branch?.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-gray-600">{pt.pt_exam?.title}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-black text-red-600">{pt.final_score || 'N/A'}</div>
                                                            <div className="text-[10px] font-black uppercase text-gray-400">{pt.status}</div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-400 font-medium">No tests taken today.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {/* New Registrations Table */}
                                <Card>
                                    <div className="px-6 py-5 border-b border-gray-50 bg-slate-50/50">
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Daily Form Registrations</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/20">
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Name</th>
                                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-50">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {registrations.length > 0 ? registrations.map((reg) => (
                                                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-900">{reg.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{reg.branch?.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                                reg.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                                            }`}>
                                                                {reg.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="2" className="px-6 py-8 text-center text-sm text-gray-400 font-medium">No form registrations today.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </CrmLayout>
            </div>
        </AuthenticatedLayout>
    );
}
