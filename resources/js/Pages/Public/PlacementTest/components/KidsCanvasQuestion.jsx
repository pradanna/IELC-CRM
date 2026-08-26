import React, { useState, useEffect } from 'react';
import { 
    DndContext, 
    DragOverlay, 
    useDraggable, 
    useDroppable, 
    PointerSensor, 
    TouchSensor, 
    useSensor, 
    useSensors 
} from '@dnd-kit/core';
import { Sparkles, CheckCircle2, RotateCcw, Volume2, Move, HelpCircle } from 'lucide-react';

// Draggable Card Component
function DraggableCard({ item, isOverlay = false }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        data: item,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing select-none px-4 py-3 bg-white rounded-2xl border-2 shadow-sm flex items-center gap-2.5 transition-all ${
                isDragging 
                    ? 'opacity-40 border-dashed border-amber-400 bg-amber-50 scale-95' 
                    : isOverlay
                    ? 'border-amber-500 bg-amber-50/90 shadow-xl scale-105 rotate-2 z-50'
                    : 'border-slate-200 hover:border-amber-400 hover:shadow-md active:scale-95'
            }`}
        >
            <Move className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-black text-sm text-slate-800 tracking-tight">
                {item.text || item.label}
            </span>
        </div>
    );
}

// Droppable Zone Box Component
function DroppableZone({ zone, items = [], isOver }) {
    const { setNodeRef } = useDroppable({
        id: zone.id,
        data: zone,
    });

    const colorClasses = {
        amber: 'border-amber-300 bg-amber-50/40 text-amber-900',
        emerald: 'border-emerald-300 bg-emerald-50/40 text-emerald-900',
        sky: 'border-sky-300 bg-sky-50/40 text-sky-900',
        indigo: 'border-indigo-300 bg-indigo-50/40 text-indigo-900',
        rose: 'border-rose-300 bg-rose-50/40 text-rose-900',
        purple: 'border-purple-300 bg-purple-50/40 text-purple-900',
    };

    const activeColor = colorClasses[zone.color] || colorClasses.amber;

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[160px] sm:min-h-[190px] p-4 rounded-3xl border-3 border-dashed transition-all flex flex-col justify-between ${
                isOver
                    ? 'border-amber-500 bg-amber-100/60 ring-4 ring-amber-400/20 scale-[1.02]'
                    : activeColor
            }`}
        >
            <div className="flex items-center justify-between border-b border-black/5 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                    <h4 className="font-black text-xs uppercase tracking-wider">
                        {zone.label}
                    </h4>
                </div>
                <span className="px-2 py-0.5 bg-white/80 rounded-full font-black text-[10px] text-slate-600 shadow-2xs">
                    {items.length} Item
                </span>
            </div>

            {/* Dropped items within this zone */}
            <div className="flex-1 flex flex-wrap gap-2 content-start min-h-[70px]">
                {items.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 opacity-40">
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Tarik & Letakkan ke sini
                        </span>
                    </div>
                ) : (
                    items.map(it => (
                        <DraggableCard key={it.id} item={it} />
                    ))
                )}
            </div>
        </div>
    );
}

export default function KidsCanvasQuestion({ 
    question, 
    value, 
    onChange, 
    isReview = false 
}) {
    // Parse options into draggable items
    const parsedItems = React.useMemo(() => {
        return (question.options || []).map(opt => {
            try {
                const parsed = JSON.parse(opt.text);
                return {
                    id: opt.id,
                    text: parsed.text || opt.text,
                    image: parsed.image || '',
                    target_zone: parsed.target_zone || parsed.correct_zone || '',
                    original: parsed,
                };
            } catch (e) {
                return {
                    id: opt.id,
                    text: opt.text,
                    image: '',
                    target_zone: '',
                };
            }
        });
    }, [question.options]);

    // Extract Drop Zones from question options metadata
    const zones = React.useMemo(() => {
        const uniqueZonesMap = {};
        parsedItems.forEach((it, idx) => {
            const zId = it.target_zone || `zone_${idx + 1}`;
            if (!uniqueZonesMap[zId]) {
                const colors = ['amber', 'emerald', 'sky', 'indigo', 'rose'];
                uniqueZonesMap[zId] = {
                    id: zId,
                    label: zId.replace('zone_', 'Kategori ').toUpperCase(),
                    color: colors[Object.keys(uniqueZonesMap).length % colors.length]
                };
            }
        });
        return Object.values(uniqueZonesMap);
    }, [parsedItems]);

    // Mapping state: { zone_id: [item_id, ...] }
    const [assignments, setAssignments] = useState(() => {
        if (!value) return {};
        return typeof value === 'string' ? JSON.parse(value) : value;
    });

    const [activeDragItem, setActiveDragItem] = useState(null);

    // Sensors supporting Mouse and Touch Screen (iPad, Tablet, Smartphone)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 5,
            },
        })
    );

    // Items currently in the pool (unassigned)
    const unassignedItems = parsedItems.filter(it => {
        return !Object.values(assignments).some(itemIds => (itemIds || []).includes(it.id));
    });

    const handleDragStart = (event) => {
        const item = parsedItems.find(it => it.id === event.active.id);
        setActiveDragItem(item || null);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) {
            // Dropped outside -> Return to pool
            const newAssignments = { ...assignments };
            Object.keys(newAssignments).forEach(zId => {
                newAssignments[zId] = (newAssignments[zId] || []).filter(id => id !== active.id);
            });
            setAssignments(newAssignments);
            onChange(newAssignments);
            return;
        }

        const targetZoneId = over.id;
        const itemId = active.id;

        // Remove from other zones and add to targetZoneId
        const newAssignments = { ...assignments };
        Object.keys(newAssignments).forEach(zId => {
            newAssignments[zId] = (newAssignments[zId] || []).filter(id => id !== itemId);
        });

        if (!newAssignments[targetZoneId]) {
            newAssignments[targetZoneId] = [];
        }
        newAssignments[targetZoneId].push(itemId);

        setAssignments(newAssignments);
        onChange(newAssignments);
    };

    const handleReset = () => {
        setAssignments({});
        onChange({});
    };

    return (
        <div className="space-y-6">
            {/* Header / Instructions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-amber-50/70 border border-amber-200 rounded-3xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
                        <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900">
                            {question.text || 'Tarik kartu dan masukkan ke dalam kotak yang benar!'}
                        </h3>
                        <p className="text-xs font-semibold text-amber-800">
                            Sentuh / tarik kartu ke kotak wadah di bawah ini.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Posisi</span>
                </button>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* 1. Item Pool (Unassigned cards) */}
                <div className="p-5 bg-slate-100/80 rounded-3xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Pilihan Kartu ({unassignedItems.length} tersisa)
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5 min-h-[50px] items-center">
                        {unassignedItems.length === 0 ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-black text-xs py-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Hebat! Semua kartu sudah diletakkan.</span>
                            </div>
                        ) : (
                            unassignedItems.map(it => (
                                <DraggableCard key={it.id} item={it} />
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Target Drop Zones Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {zones.map(zone => {
                        const assignedIds = assignments[zone.id] || [];
                        const assignedItemsList = parsedItems.filter(it => assignedIds.includes(it.id));
                        return (
                            <DroppableZone
                                key={zone.id}
                                zone={zone}
                                items={assignedItemsList}
                            />
                        );
                    })}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeDragItem ? (
                        <DraggableCard item={activeDragItem} isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
