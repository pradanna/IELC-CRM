import React, { useState, useMemo } from 'react';
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
import { Sparkles, CheckCircle2, RotateCcw, Move, HelpCircle, Image as ImageIcon, X } from 'lucide-react';

// Draggable Word Bank Card
function DraggableWord({ word, isOverlay = false, isUsed = false }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: word.id,
        data: word,
        disabled: isUsed && !isOverlay,
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
            className={`cursor-grab active:cursor-grabbing select-none px-4 py-2 rounded-2xl border-2 font-black text-sm transition-all flex items-center gap-2 ${
                isDragging
                    ? 'opacity-40 border-dashed border-amber-400 bg-amber-50 scale-95'
                    : isOverlay
                    ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-2xl scale-110 rotate-2 z-50 ring-4 ring-amber-400/30'
                    : isUsed
                    ? 'opacity-30 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-amber-900 border-amber-300 hover:border-amber-500 hover:shadow-lg hover:scale-105 active:scale-95 shadow-sm'
            }`}
        >
            <Move className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{word.text}</span>
        </div>
    );
}

// Droppable Pin Zone on Image
function DroppablePinZone({ pin, assignedWord, onRemove, isReview, isCorrect }) {
    const { setNodeRef, isOver } = useDroppable({
        id: pin.id,
        data: pin,
        disabled: isReview,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                left: `${pin.x_percent}%`,
                top: `${pin.y_percent}%`,
                transform: 'translate(-50%, -50%)',
            }}
            className={`absolute z-20 min-w-[75px] min-h-[36px] px-2.5 py-1 rounded-2xl border-2 transition-all flex items-center justify-center shadow-lg backdrop-blur-xs select-none ${
                isOver
                    ? 'border-amber-500 bg-amber-400/90 text-slate-950 scale-115 ring-4 ring-amber-400/40 z-30 shadow-2xl'
                    : assignedWord
                    ? isReview
                        ? isCorrect
                            ? 'border-emerald-500 bg-emerald-500 text-white ring-4 ring-emerald-400/30'
                            : 'border-rose-500 bg-rose-500 text-white ring-4 ring-rose-400/30'
                        : 'border-amber-500 bg-amber-400 text-slate-950 ring-2 ring-amber-400/30'
                    : 'border-dashed border-sky-400 bg-sky-50/80 text-sky-800 hover:border-amber-400 hover:bg-amber-50/70'
            }`}
        >
            <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-black/15 text-[9px] font-black flex items-center justify-center shrink-0">
                    {pin.number}
                </span>

                {assignedWord ? (
                    <div className="flex items-center gap-1">
                        <span className="font-black text-xs tracking-tight">
                            {assignedWord.text}
                        </span>
                        {!isReview && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(pin.id);
                                }}
                                className="w-4 h-4 rounded-full bg-black/10 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors text-[9px]"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                ) : (
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">
                        Drop #{pin.number}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function KidsImagePinQuestion({
    question,
    value,
    onChange,
    isReview = false
}) {
    // Parse Canvas Payload from question options
    const canvasConfig = useMemo(() => {
        const firstOpt = (question.options || [])[0];
        if (!firstOpt) return null;
        try {
            return JSON.parse(firstOpt.text || firstOpt.option_text);
        } catch (e) {
            return null;
        }
    }, [question.options]);

    // Fallback if not canvas config
    const wordBank = canvasConfig?.word_bank || [];
    const dropZones = canvasConfig?.drop_zones || [];
    const imageUrl = question.audio_path 
        ? `/storage/${question.audio_path}` 
        : (canvasConfig?.image_preview || '');

    // User's answer state: { [pin_id]: word_id }
    const [answers, setAnswers] = useState(() => {
        if (!value) return {};
        return typeof value === 'string' ? JSON.parse(value) : value;
    });

    const [activeWord, setActiveWord] = useState(null);

    // Touch & Pointer Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5,
            },
        })
    );

    // List of word IDs already placed
    const usedWordIds = Object.values(answers);

    const handleDragStart = (event) => {
        if (isReview) return;
        const word = wordBank.find(w => w.id === event.active.id);
        setActiveWord(word || null);
    };

    const handleDragEnd = (event) => {
        if (isReview) return;
        const { active, over } = event;
        setActiveWord(null);

        if (!over) return;

        const targetPinId = over.id;
        const wordId = active.id;

        const updated = { ...answers, [targetPinId]: wordId };
        setAnswers(updated);
        onChange(updated);
    };

    const handleRemoveFromPin = (pinId) => {
        if (isReview) return;
        const updated = { ...answers };
        delete updated[pinId];
        setAnswers(updated);
        onChange(updated);
    };

    const handleResetAll = () => {
        if (isReview) return;
        setAnswers({});
        onChange({});
    };

    return (
        <div className="space-y-6">
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* 1. Sticky / Floating Word Bank */}
                <div className="sticky top-2 z-30 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-5 rounded-3xl border-2 border-amber-200 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
                                <Sparkles className="w-4 h-4" />
                            </span>
                            <h4 className="font-black text-xs uppercase tracking-widest text-amber-950">
                                Word Bank (Pilihan Kata)
                            </h4>
                        </div>

                        {!isReview && Object.keys(answers).length > 0 && (
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="text-[10px] font-black text-amber-800 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset Jawaban
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        {wordBank.map((word) => (
                            <DraggableWord
                                key={word.id}
                                word={word}
                                isUsed={usedWordIds.includes(word.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* 2. Interactive Image Worksheet Area */}
                <div className="relative bg-slate-900/5 rounded-3xl border-2 border-slate-200 overflow-hidden shadow-inner p-2 sm:p-4 flex items-center justify-center">
                    {imageUrl ? (
                        <div className="relative inline-block select-none max-w-full">
                            <img
                                src={imageUrl}
                                alt="Worksheet Dialogue"
                                className="w-full max-h-[650px] object-contain rounded-2xl block pointer-events-none shadow-sm"
                            />

                            {/* Overlay Droppable Pin Zones */}
                            {dropZones.map((pin) => {
                                const assignedWordId = answers[pin.id];
                                const assignedWord = wordBank.find(w => w.id === assignedWordId);
                                const isCorrect = pin.correct_word_id === assignedWordId;

                                return (
                                    <DroppablePinZone
                                        key={pin.id}
                                        pin={pin}
                                        assignedWord={assignedWord}
                                        onRemove={handleRemoveFromPin}
                                        isReview={isReview}
                                        isCorrect={isCorrect}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-400 flex flex-col items-center">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p className="font-bold text-xs uppercase tracking-wider">Gambar Worksheet Tidak Ditemukan</p>
                        </div>
                    )}
                </div>

                {/* Drag Overlay for smooth animation */}
                <DragOverlay>
                    {activeWord ? (
                        <DraggableWord word={activeWord} isOverlay={true} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
