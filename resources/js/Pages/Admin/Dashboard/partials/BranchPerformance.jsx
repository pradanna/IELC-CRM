import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

export default function BranchPerformance({ performanceData }) {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Target className="text-red-500" size={18} />
                        Branch Performance
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight">Real-time enrollment track</p>
                </div>
                <div className="bg-red-50 p-2 rounded-lg">
                    <TrendingUp className="text-red-500" size={18} />
                </div>
            </div>

            <div className="space-y-12 flex-1 flex flex-col justify-center">
                {performanceData.map((branch, index) => (
                    <div key={index} className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="font-bold text-lg text-gray-900">{branch.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Target Cabang</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-lg text-gray-900">{branch.actual} / {branch.target}</span>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">{branch.achievement}% Achieved</p>
                            </div>
                        </div>
                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(branch.achievement, 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Enrollment</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Goal</span>
                </div>
            </div>
        </div>
    );
}
