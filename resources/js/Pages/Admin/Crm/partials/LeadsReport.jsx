import React from "react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from "recharts";
import { useLeadsReport } from "../hooks/useLeadsReport";
import { Target, Users, TrendingUp, Lightbulb, CheckCircle, XCircle, Zap, UserMinus } from "lucide-react";

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function LeadsReport({ 
    leads = [], 
    sources = [], 
    phases = [], 
    branches = [], 
    insights = [], 
    newLeadsCount, 
    enrolledLeadsCount,
    successRates: backendSuccessRates
}) {
    const { sourceData, phaseData, branchData, stats, successRates: localSuccessRates } = useLeadsReport({ 
        leads, 
        sources, 
        phases, 
        branches,
        newLeadsCount,
        enrolledLeadsCount
    });

    // Single source of truth: favor backend pre-calculated rates for report consistency
    const successRates = backendSuccessRates || localSuccessRates;

    const Card = ({ children, className = "" }) => (
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
            {children}
        </div>
    );

    return (
        <div className="space-y-10">
            {/* Automated Insights Section */}
            {insights.length > 0 && (
                <Card className="bg-red-50/30 border-red-100 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-600 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Automated Insights & Recommendations</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {insights.map((insight, idx) => (
                            <div key={idx} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-red-50/50 shadow-sm transition-all hover:translate-y-[-2px]">
                                <p className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: insight }} />
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card className="p-6 flex items-center gap-5">
                    <div className="p-4 bg-red-50 rounded-2xl">
                        <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Total Leads</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">{stats.total}</p>
                    </div>
                </Card>
                
                <Card className="p-6 flex items-center gap-5">
                    <div className="p-4 bg-green-50 rounded-2xl">
                        <Target className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Enrolled</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">{stats.joined}</p>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-5">
                    <div className="p-4 bg-blue-50 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Success Rate</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">{stats.conversionRate}%</p>
                    </div>
                </Card>
            </div>

            {/* Detailed Success Rates Grid */}
            <div className="space-y-8">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-4 w-1 bg-red-600 rounded-full" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sales Performance (%)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <TrendingUp size={18} />
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-gray-900 block leading-tight">{successRates.new_to_prospective?.percentage || 0}%</span>
                                    <span className="text-[10px] font-bold text-gray-400">{successRates.new_to_prospective?.count || 0} / {successRates.new_to_prospective?.total || 0}</span>
                                 </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valid Leads / Leads</p>
                            <p className="text-[9px] text-gray-400 leading-tight">Konversi dari total lead ke prospek</p>
                        </Card>

                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <Zap size={18} />
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-gray-900 block leading-tight">{successRates.prospective_to_consultation?.percentage || 0}%</span>
                                    <span className="text-[10px] font-bold text-gray-400">{successRates.prospective_to_consultation?.count || 0} / {successRates.prospective_to_consultation?.total || 0}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Consultations / Valid Leads</p>
                            <p className="text-[9px] text-gray-400 leading-tight">Prospek yang lanjut ke konsultasi</p>
                        </Card>

                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Target size={18} />
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-gray-900 block leading-tight">{successRates.consultation_to_pt?.percentage || 0}%</span>
                                    <span className="text-[10px] font-bold text-gray-400">{successRates.consultation_to_pt?.count || 0} / {successRates.consultation_to_pt?.total || 0}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Placement Tests / Consultations</p>
                            <p className="text-[9px] text-gray-400 leading-tight">Konsultasi yang lanjut ke PT</p>
                        </Card>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-4 w-1 bg-green-600 rounded-full" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Enrollment Conversion Metrics</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                    <CheckCircle size={18} />
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-gray-900 block leading-tight">{successRates.pt_to_closing?.percentage || 0}%</span>
                                    <span className="text-[10px] font-bold text-gray-400">{successRates.pt_to_closing?.count || 0} / {successRates.pt_to_closing?.total || 0}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Joins / Placement Tests</p>
                            <p className="text-[9px] text-gray-400 leading-tight">Konversi dari PT ke daftar</p>
                        </Card>

                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                                    <CheckCircle size={18} />
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-gray-900 block leading-tight">{successRates.new_to_closing?.percentage || 0}%</span>
                                    <span className="text-[10px] font-bold text-gray-400">{successRates.new_to_closing?.count || 0} / {successRates.new_to_closing?.total || 0}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Joins from Leads</p>
                            <p className="text-[9px] text-gray-400 leading-tight">Total konversi dari semua lead</p>
                        </Card>

                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                                    <CheckCircle size={18} />
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-gray-900 block leading-tight">{successRates.prospective_to_closing?.percentage || 0}%</span>
                                    <span className="text-[10px] font-bold text-gray-400">{successRates.prospective_to_closing?.count || 0} / {successRates.prospective_to_closing?.total || 0}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Join from Valid Leads</p>
                            <p className="text-[9px] text-gray-400 leading-tight">Konversi dari lead prospek</p>
                        </Card>

                        <Card className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                                    <CheckCircle size={18} />
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-black text-gray-900 block leading-tight">{successRates.consultation_to_closing?.percentage || 0}%</span>
                                    <span className="text-[10px] font-bold text-gray-400">{successRates.consultation_to_closing?.count || 0} / {successRates.consultation_to_closing?.total || 0}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Joins from Consultations</p>
                            <p className="text-[9px] text-gray-400 leading-tight">Konversi dari konsultasi</p>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sources Report */}
                <Card className="flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Leads by Source</h3>
                    </div>
                    <div className="p-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sourceData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    fontSize={10} 
                                    width={100} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{fontWeight: 'bold', fill: '#64748b'}}
                                />
                                <Tooltip 
                                    cursor={{fill: '#fef2f2'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#ef4444" radius={[0, 8, 8, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Status Funnel */}
                <Card className="flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Conversion Funnel (Phases)</h3>
                    </div>
                    <div className="p-6 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={phaseData} margin={{ top: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={9} 
                                    axisLine={false} 
                                    tickLine={false}
                                    interval={0}
                                    tick={{fontWeight: 'bold', fill: '#64748b'}}
                                />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fill: '#64748b'}} />
                                <Tooltip 
                                    cursor={{fill: '#fef2f2'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={35}>
                                    {phaseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Branch Distribution */}
                <Card className="flex flex-col lg:col-span-2">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Branch Performance Distribution</h3>
                    </div>
                    <div className="p-8 h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={branchData} margin={{ top: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    fontSize={12} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tick={{fontWeight: 'bold', fill: '#64748b'}}
                                    label={{ value: 'IELC Branches', position: 'bottom', offset: 0, fontSize: 10, fontWeight: 'black', fill: '#94a3b8', textAnchor: 'middle' }}
                                />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fill: '#64748b'}} />
                                <Tooltip 
                                    cursor={{fill: '#fef2f2'}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#ef4444" radius={[10, 10, 0, 0]} barSize={80} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
