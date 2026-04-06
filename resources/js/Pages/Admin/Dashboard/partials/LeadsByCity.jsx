import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';

export default function LeadsByCity({ cityData }) {
    if (!cityData || cityData.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
                <MapPin className="text-gray-200 mb-4" size={48} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No City Data Available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="text-blue-500" size={18} />
                        Leads By City
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight">Geographic Distribution</p>
                </div>
            </div>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={cityData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="city" 
                            type="category" 
                            width={100}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase', marginBottom: '4px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}
                        />
                        <Bar 
                            dataKey="count" 
                            radius={[0, 10, 10, 0]}
                            barSize={24}
                        >
                            {cityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={1 - (index * 0.08)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
