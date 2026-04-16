import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { User, Phone, MapPin, MessageSquare, GripVertical } from 'lucide-react';

export default function KanbanCard({ lead, onClick, isOverlay = false }) {
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{lead.lead_number}</span>
                            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                lead.is_online 
                                    ? 'bg-emerald-50 text-emerald-600' 
                                    : 'bg-orange-50 text-orange-600'
                            }`}>
                                {lead.is_online ? 'Online' : 'Offline'}
                            </span>
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
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                    <MapPin size={10} className="text-slate-300 shrink-0" />
                    <span className="truncate">{lead.branch?.name || 'No Branch'}</span>
                </div>
            </div>

            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded-md">
                    <MessageSquare size={8} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">
                        {lead.follow_up_count || 0} FUP
                    </span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 uppercase">
                    {lead.formatted_at}
                </span>
            </div>
        </div>
    );
}
