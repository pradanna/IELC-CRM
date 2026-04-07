import React from 'react';
import * as LucideIcons from 'lucide-react';
import useLeadPhaseStyle from '@/Hooks/useLeadPhaseStyle';

export default function StatsCard({ title, value, icon, color, bg, variant = 'standard', phaseCode, subtitle }) {
    const { getPhaseStyle } = useLeadPhaseStyle();
    
    // Resolve style from phaseCode if provided, otherwise use explicit props
    const style = phaseCode ? getPhaseStyle(phaseCode) : null;
    
    const Icon = style?.icon || (typeof icon === 'string' 
        ? (LucideIcons[icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-./g, (g) => g[1].toUpperCase())] || LucideIcons.Activity)
        : (icon || LucideIcons.Activity));

    const finalColor = style?.color || color;
    const finalBg = style?.bg || bg;
    const finalTitle = style?.label ? style.label.toUpperCase() : title;

    if (variant === 'primary') {
        return (
            <div className="bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200 flex items-center justify-between group hover:shadow-2xl transition-all duration-300 border-none relative overflow-hidden">
                {/* Subtle highlight effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="space-y-1 relative z-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {finalTitle}
                    </p>
                    <h3 className="text-5xl font-black text-white leading-none tracking-tighter">
                        {value}
                    </h3>
                    {subtitle && (
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                <div className="p-4 rounded-2xl bg-slate-800 text-indigo-400 backdrop-blur-md transition-transform duration-300 group-hover:scale-110 relative z-10 shadow-inner">
                    <Icon size={32} strokeWidth={2.5} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all duration-300">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {finalTitle}
                </p>
                <h3 className="text-3xl font-bold text-gray-900">
                    {value}
                </h3>
                {subtitle && (
                    <p className="text-[9px] font-medium text-gray-400 mt-1 italic uppercase tracking-wider">
                        {subtitle}
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${finalBg} ${finalColor} transition-transform duration-300 group-hover:scale-110`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
    );
}
