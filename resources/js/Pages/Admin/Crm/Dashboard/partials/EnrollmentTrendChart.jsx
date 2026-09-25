import React from 'react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    ReferenceLine
} from 'recharts';
import { TrendingUp, Target } from 'lucide-react';

export default function EnrollmentTrendChart({ trendData }) {
    const target = trendData[0]?.target || 0;
    const todayPoint = trendData.find(d => d.is_today);

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Enrollment Target vs Achieved</h2>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Monthly performance track</p>
                </div>
                <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Total Enrolled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Solo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Semarang</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Monthly Target</span>
                    </div>
                    {todayPoint && (
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Today</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={trendData}>
                        <defs>
                            <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="label" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                            dx={-10}
                            domain={[0, (dataMax) => {
                                const currentTarget = Number(target) || 0;
                                const maxVal = Math.max(currentTarget, Number(dataMax) || 0);
                                return maxVal === 0 ? 10 : Math.ceil(maxVal * 1.1) + 2;
                            }]}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase', marginBottom: '4px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value, name) => {
                                const labels = {
                                    enrolled: 'Total Enrolled',
                                    enrolled_solo: 'Solo Enrolled',
                                    enrolled_semarang: 'Semarang Enrolled',
                                    enrolled_online: 'Online Enrolled',
                                    enrolled_offline: 'Offline Enrolled'
                                };
                                return [value, labels[name] || name];
                            }}
                        />
                        <ReferenceLine 
                            y={target} 
                            stroke="#ef4444" 
                            strokeDasharray="5 5" 
                            strokeWidth={2}
                            label={{ value: `TARGET: ${target}`, fill: '#ef4444', fontSize: 10, fontWeight: 800, position: 'right' }} 
                        />
                        {todayPoint && (
                            <ReferenceLine 
                                x={todayPoint.label} 
                                stroke="#6366f1" 
                                strokeDasharray="4 4" 
                                strokeWidth={2}
                                label={{ 
                                    value: 'TODAY', 
                                    fill: '#6366f1', 
                                    fontSize: 9, 
                                    fontWeight: 900, 
                                    position: 'insideTopLeft',
                                    offset: 10
                                }} 
                            />
                        )}
                        <Area 
                            type="stepAfter" 
                            dataKey="enrolled" 
                            name="enrolled"
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorEnrolled)" 
                            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line 
                            type="stepAfter" 
                            dataKey="enrolled_solo" 
                            name="enrolled_solo"
                            stroke="#0284c7" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line 
                            type="stepAfter" 
                            dataKey="enrolled_semarang" 
                            name="enrolled_semarang"
                            stroke="#d97706" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line 
                            type="stepAfter" 
                            dataKey="enrolled_online" 
                            name="enrolled_online"
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
