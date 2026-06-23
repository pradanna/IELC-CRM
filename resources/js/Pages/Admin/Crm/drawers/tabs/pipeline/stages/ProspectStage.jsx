import React from 'react';
import { Target, Globe, ChevronDown, Clock } from 'lucide-react';
import { InfoItem } from '../../../components/DrawerUI';

export default function ProspectStage({
    lead,
    updatingQualification,
    handleUpdateQualification,
    normalizedLeadTypes,
    FieldStatus
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dropdown Program Interest */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative cursor-pointer group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Program Minat</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <Target size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <div className="relative flex-1">
                        <select
                            value={lead?.lead_type_id || ''}
                            onChange={(e) => handleUpdateQualification({ lead_type_id: e.target.value || null, is_online: lead.is_online }, 'lead_type_id')}
                            disabled={updatingQualification}
                            className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none cursor-pointer pr-6 focus:ring-0 appearance-none"
                        >
                            <option value="">Pilih Program...</option>
                            {normalizedLeadTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <FieldStatus name="lead_type_id" />
            </div>

            {/* Dropdown Study Mode */}
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-100 focus-within:border-red-500 transition-all hover:bg-slate-50/80 relative cursor-pointer group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none group-hover:text-red-500 transition-colors">Metode Belajar</label>
                <div className="flex items-center gap-3 mt-1.5 relative">
                    <Globe size={16} className="text-slate-300 flex-shrink-0 group-hover:text-red-400 transition-colors" />
                    <div className="relative flex-1">
                        <select
                            value={lead?.is_online ? '1' : '0'}
                            onChange={(e) => handleUpdateQualification({ lead_type_id: lead.lead_type_id, is_online: e.target.value === '1' }, 'is_online')}
                            disabled={updatingQualification}
                            className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-800 outline-none cursor-pointer pr-6 focus:ring-0 appearance-none"
                        >
                            <option value="0">On Campus (Offline)</option>
                            <option value="1">Online</option>
                        </select>
                        <ChevronDown size={14} className="text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <FieldStatus name="is_online" />
            </div>

            {/* Last Engagement */}
            <InfoItem 
                label="Last Engagement" 
                value={lead?.human_last_activity_at} 
                icon={Clock} 
            />
        </div>
    );
}
