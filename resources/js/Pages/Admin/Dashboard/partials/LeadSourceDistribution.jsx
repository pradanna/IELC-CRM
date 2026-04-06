import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Filter, Users } from 'lucide-react';

export default function LeadSourceDistribution({ sourceData, totalLeads }) {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Filter className="text-red-500" size={18} />
                        CRM Lead Sources
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight">Current Pipeline Status</p>
                </div>
                <div className="text-right">
                    <span className="text-xl font-black text-gray-900">{totalLeads}</span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Total Prospek</p>
                </div>
            </div>

            <div className="flex-1 relative min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={sourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            stroke="none"
                        >
                            {sourceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <Users className="text-gray-200" size={40} />
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4">
                {sourceData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-900 transition-colors">
                                {item.name}
                            </span>
                        </div>
                        <span className="text-xs font-black text-gray-900 group-hover:scale-110 transition-transform">
                            {item.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
