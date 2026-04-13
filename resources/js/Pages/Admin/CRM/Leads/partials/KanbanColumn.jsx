import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import useLeadPhaseStyle from '@/Hooks/useLeadPhaseStyle';

export default function KanbanColumn({ phase, leads, onCardClick }) {
    const { getPhaseStyle } = useLeadPhaseStyle();
    const styleKey = phase.code || phase.name?.toLowerCase()?.replace(/\s+/g, '-');
    const style = getPhaseStyle(styleKey);
    const Icon = style.icon;

    const { setNodeRef } = useDroppable({
        id: phase.id,
        data: {
            type: 'Column',
            phase
        }
    });

    return (
        <div ref={setNodeRef} className={`flex flex-col w-80 shrink-0 rounded-3xl p-4 border border-slate-100/50 ${style.bg} min-h-full`}>
            {/* Column Header */}
            <div className={`shrink-0 flex items-center justify-between mb-6 px-2 ${style.color}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${style.color}`}>
                        <Icon size={14} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.12em]">
                        {phase.name} ({(leads.data || leads).length})
                    </h3>
                </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 space-y-4 pb-4 min-h-[150px]">
                <SortableContext items={(leads.data || leads).map(l => l.id)} strategy={verticalListSortingStrategy}>
                    {(leads.data || leads).map(lead => (
                        <KanbanCard key={lead.id} lead={lead} onClick={onCardClick} /> 
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
