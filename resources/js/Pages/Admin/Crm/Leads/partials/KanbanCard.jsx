import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Phone, MapPin, MessageSquare, GripVertical, Building2 } from 'lucide-react';
import useBranchStyle from '@/Hooks/useBranchStyle';

const WhatsAppIcon = ({ size = 12, className = "" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        width={size} 
        height={size} 
        fill="currentColor" 
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

export default function KanbanCard({ lead, onClick, isOverlay = false, onWhatsappClick }) {
    const sortable = useSortable({
        id: lead.id,
        data: {
            type: 'Lead',
            lead
        }
    });

    // If it's an overlay, we ignore the sortable hooks
    const attributes = isOverlay ? {} : sortable.attributes;
    const listeners = isOverlay ? {} : sortable.listeners;
    const setNodeRef = isOverlay ? null : sortable.setNodeRef;
    
    const style = isOverlay ? { cursor: 'grabbing' } : {
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.3 : 1,
    };

    const handleWhatsappClick = (e) => {
        e.stopPropagation();
        if (onWhatsappClick) onWhatsappClick(lead);
    };

    // Calculate inactivity alert: if last activity (or creation) >= 4 days ago and in active phases, flag as neglected
    const referenceDate = lead.last_activity_at ? new Date(lead.last_activity_at) : new Date(lead.created_at);
    const daysAgo = Math.floor((new Date() - referenceDate) / (1000 * 60 * 60 * 24));
    const activePhaseCodes = ['lead', 'prospect', 'consultation', 'placement-test', 'pre-enrollment', 'invoice'];
    const isNeglected = activePhaseCodes.includes(lead.lead_phase?.code) && daysAgo >= 4;

    const getProgramBadgeStyle = (typeName) => {
        const name = typeName?.toLowerCase() || '';
        if (name.includes('ielts')) {
            return 'bg-purple-50 text-purple-600 border border-purple-100';
        }
        if (name.includes('toefl')) {
            return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
        }
        if (name.includes('kids')) {
            return 'bg-pink-50 text-pink-600 border border-pink-100';
        }
        if (name.includes('teens')) {
            return 'bg-amber-50 text-amber-600 border border-amber-100';
        }
        if (name.includes('adult') || name.includes('dewasa')) {
            return 'bg-teal-50 text-teal-600 border border-teal-100';
        }
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white border border-slate-100 rounded-xl p-3 shadow-sm transition-all group select-none touch-none ${
                isOverlay ? 'shadow-xl rotate-3 cursor-grabbing scale-105' : 'hover:shadow-md cursor-grab active:cursor-grabbing'
            }`}
            onClick={(e) => {
                if (onClick) onClick(lead.id);
            }}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors relative">
                        <User size={12} />
                        {/* Online/Offline Status Dot */}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                            lead.is_online ? 'bg-emerald-500' : 'bg-orange-500'
                        }`} />
                    </div>
                    <div className="overflow-hidden">
                        <h4 className="text-[13px] font-black text-slate-800 leading-tight truncate">{lead.name}</h4>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{lead.lead_number}</span>
                            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                lead.is_online 
                                    ? 'bg-emerald-55/10 text-emerald-600' 
                                    : 'bg-orange-55/10 text-orange-600'
                            }`}>
                                {lead.is_online ? 'Online' : 'Offline'}
                            </span>
                            {lead.lead_type && (
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${getProgramBadgeStyle(lead.lead_type.name)}`}>
                                    {lead.lead_type.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-1 text-slate-200 group-hover:text-slate-400 shrink-0 ml-1">
                    <GripVertical size={14} />
                </div>
            </div>

            <div className="space-y-1 mb-3">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                    <Phone size={10} className="text-slate-300 shrink-0" />
                    <span className="truncate">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium">
                    {(() => {
                        const { getBranchStyle } = useBranchStyle();
                        const branchStyle = getBranchStyle(lead.branch?.name);
                        return (
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border ${branchStyle.bg} ${branchStyle.text} ${branchStyle.border} flex items-center gap-1`}>
                                <Building2 size={10} className={branchStyle.icon} />
                                <span className="truncate">{lead.branch?.name || 'No Branch'}</span>
                            </span>
                        );
                    })()}
                </div>
            </div>

            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded-md">
                        <MessageSquare size={8} className="text-slate-400" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                            {lead.follow_up_count || 0} FUP
                        </span>
                    </div>
                    {onWhatsappClick && (
                        <button
                            onClick={handleWhatsappClick}
                            className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100 transition-all shadow-sm"
                            title="Send WhatsApp Template"
                        >
                            <WhatsAppIcon size={10} />
                        </button>
                    )}
                </div>
                
                {isNeglected ? (
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-tight flex items-center gap-0.5 animate-pulse bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        ⚠️ IDLE {daysAgo} DAYS
                    </span>
                ) : lead.lead_phase?.code === 'enrollment' ? (
                    <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        ENROLLED{lead.enrollment_count > 0 ? ` (${lead.enrollment_count} Kelas)` : ''}: {lead.formatted_enrolled_at || lead.formatted_at}
                    </span>
                ) : lead.formatted_last_activity_at ? (
                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        FUP: {lead.formatted_last_activity_at}
                    </span>
                ) : (
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                        REG: {lead.formatted_at}
                    </span>
                )}
            </div>
        </div>
    );
}
