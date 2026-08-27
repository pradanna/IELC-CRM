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
import { Sparkles, CheckCircle2, RotateCcw, Move, X, Eye } from 'lucide-react';

// Draggable Token Component (supports both Ring Token & Word Token)
function DraggableTokenItem({ token, isOverlay = false, isUsed = false }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: token.id,
        data: token,
        disabled: isUsed && !isOverlay,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    if (token.type === 'ring') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`cursor-grab active:cursor-grabbing select-none w-14 h-9 rounded-full border-3 border-emerald-500 bg-emerald-500/20 flex items-center justify-center transition-all ${
                    isDragging
                        ? 'opacity-30 border-dashed border-emerald-400 scale-95'
                        : isOverlay
                        ? 'scale-125 border-emerald-400 bg-emerald-500/40 shadow-2xl z-50 ring-4 ring-emerald-400/30'
                        : isUsed
                        ? 'opacity-20 border-slate-300 bg-slate-100 cursor-not-allowed'
                        : 'hover:scale-110 active:scale-95 shadow-md'
                }`}
            >
                <span className="text-[10px] font-black text-emerald-800">⭕ Ring</span>
            </div>
        );
    }

    if (token.type === 'check') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`cursor-grab active:cursor-grabbing select-none w-10 h-10 rounded-2xl border-2 font-black text-xl transition-all flex items-center justify-center ${
                    isDragging
                        ? 'opacity-30 border-dashed border-emerald-400 bg-emerald-50 scale-95'
                        : isOverlay
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xl scale-125 z-50 ring-4 ring-emerald-400/40'
                        : isUsed
                        ? 'opacity-20 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-emerald-600 border-emerald-400 hover:border-emerald-600 hover:bg-emerald-50 hover:scale-110 active:scale-95 shadow-sm'
                }`}
            >
                <span>✔</span>
            </div>
        );
    }

    if (token.type === 'cross') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`cursor-grab active:cursor-grabbing select-none w-10 h-10 rounded-2xl border-2 font-black text-xl transition-all flex items-center justify-center ${
                    isDragging
                        ? 'opacity-30 border-dashed border-rose-400 bg-rose-50 scale-95'
                        : isOverlay
                        ? 'border-rose-600 bg-rose-600 text-white shadow-2xl scale-125 z-50 ring-4 ring-rose-400/40'
                        : isUsed
                        ? 'opacity-20 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-rose-600 border-rose-400 hover:border-rose-600 hover:bg-rose-50 hover:scale-110 active:scale-95 shadow-sm'
                }`}
            >
                <span>✖</span>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing select-none px-4 py-2 rounded-2xl border-2 font-black text-sm transition-all flex items-center gap-2 ${
                isDragging
                    ? 'opacity-40 border-dashed border-orange-400 bg-orange-50 scale-95'
                    : isOverlay
                    ? 'border-orange-500 bg-orange-500 text-white shadow-2xl scale-110 rotate-2 z-50 ring-4 ring-orange-400/30'
                    : isUsed
                    ? 'opacity-30 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-orange-950 border-orange-300 hover:border-orange-500 hover:shadow-lg hover:scale-105 active:scale-95 shadow-sm'
            }`}
        >
            <Move className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>{token.text}</span>
        </div>
    );
}

// Droppable Target on Freeform Canvas
function DroppableCanvasTarget({ target, assignedToken, onRemove, isReview, isCorrect }) {
    const { setNodeRef, isOver } = useDroppable({
        id: target.id,
        data: target,
        disabled: isReview,
    });

    if (target.type === 'ring_target') {
        return (
            <div
                ref={setNodeRef}
                style={{
                    left: `${target.x}px`,
                    top: `${target.y}px`,
                    transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-20 w-16 h-10 rounded-full border-3 transition-all flex items-center justify-center select-none ${
                    isOver
                        ? 'border-emerald-400 bg-emerald-400/30 scale-125 ring-4 ring-emerald-400/40 z-30'
                        : assignedToken
                        ? isReview
                            ? isCorrect
                                ? 'border-emerald-500 bg-emerald-500/30 ring-4 ring-emerald-400/30'
                                : 'border-rose-500 bg-rose-500/30 ring-4 ring-rose-400/30'
                            : 'border-emerald-500 bg-emerald-500/25 ring-2 ring-emerald-400/20'
                        : 'border-dashed border-emerald-400/80 bg-emerald-50/40 hover:border-emerald-500'
                }`}
            >
                {assignedToken && !isReview && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(target.id);
                        }}
                        className="w-4 h-4 rounded-full bg-black/30 hover:bg-rose-500 text-white flex items-center justify-center transition-colors text-[9px]"
                    >
                        <X className="w-2.5 h-2.5" />
                    </button>
                )}
            </div>
        );
    }

    // Box Target Spot for Checkmark / Cross (Kotak Centang/Silang)
    if (target.type === 'box_target') {
        return (
            <div
                ref={setNodeRef}
                style={{
                    left: `${target.x}px`,
                    top: `${target.y}px`,
                    width: `${target.width || 36}px`,
                    height: `${target.height || 36}px`,
                }}
                className={`absolute z-20 rounded-lg border-2 transition-all flex items-center justify-center select-none ${
                    isOver
                        ? 'border-emerald-500 bg-emerald-400/30 scale-110 ring-4 ring-emerald-400/30 z-30'
                        : assignedToken
                        ? isReview
                            ? isCorrect
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-700 ring-2 ring-emerald-400/30'
                                : 'border-rose-500 bg-rose-500/20 text-rose-700 ring-2 ring-rose-400/30'
                            : 'border-slate-800 bg-white text-slate-900 shadow-sm'
                        : 'border-2 border-slate-700 bg-white hover:border-emerald-500 hover:bg-emerald-50/30'
                }`}
            >
                {assignedToken ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <span className={`font-black text-xl ${
                            assignedToken.type === 'cross' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                            {assignedToken.symbol || (assignedToken.type === 'cross' ? '✖' : '✔')}
                        </span>
                        {!isReview && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(target.id);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-800 hover:bg-rose-500 text-white flex items-center justify-center transition-colors text-[9px] shadow-sm"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        )}
                    </div>
                ) : null}
            </div>
        );
    }

    // Input Target Spot (Kotak Isian Ketik Langsung untuk Unscramble / Spelling / Ketik Jawaban)
    if (target.type === 'input_target') {
        const textValue = typeof assignedToken === 'string' ? assignedToken : (assignedToken?.text || '');
        return (
            <div
                style={{
                    position: 'absolute',
                    left: `${target.x}px`,
                    top: `${target.y}px`,
                    width: `${target.width || 120}px`,
                    height: `${target.height || 36}px`,
                    zIndex: 25,
                }}
            >
                <input
                    type="text"
                    value={textValue}
                    disabled={isReview}
                    onChange={(e) => onRemove(target.id, e.target.value)}
                    placeholder={target.placeholder || '...'}
                    className={`w-full h-full px-2.5 rounded-xl text-center font-black text-sm tracking-wide transition-all shadow-sm ${
                        isReview
                            ? isCorrect
                                ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/30'
                                : 'border-2 border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-400/30'
                            : 'border-2 border-sky-400 bg-white text-slate-800 focus:border-sky-600 focus:ring-4 focus:ring-sky-400/20 focus:bg-sky-50/40'
                    }`}
                />
            </div>
        );
    }

    // Word Target Spot
    return (
        <div
            ref={setNodeRef}
            style={{
                left: `${target.x}px`,
                top: `${target.y}px`,
                width: `${target.width || 100}px`,
                height: `${target.height || 30}px`,
            }}
            className={`absolute z-20 rounded-xl border-2 transition-all flex items-center justify-center select-none ${
                isOver
                    ? 'border-orange-500 bg-orange-400/30 backdrop-blur-sm text-orange-950 scale-105 ring-4 ring-orange-400/30 z-30'
                    : assignedToken
                    ? isReview
                        ? isCorrect
                            ? 'border-emerald-500 bg-emerald-500/30 backdrop-blur-sm text-emerald-950 ring-2 ring-emerald-400/30'
                            : 'border-rose-500 bg-rose-500/30 backdrop-blur-sm text-rose-950 ring-2 ring-rose-400/30'
                        : 'border-orange-500 bg-orange-500/25 backdrop-blur-[2px] text-orange-950 font-bold shadow-sm'
                    : 'border-dashed border-orange-300/80 bg-orange-50/20 hover:border-orange-400'
            }`}
        >
            {assignedToken ? (
                <div className="flex items-center gap-1.5 px-2">
                    <span className="font-extrabold text-xs text-orange-900 drop-shadow-sm">{assignedToken.text}</span>
                    {!isReview && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(target.id);
                            }}
                            className="w-4 h-4 rounded-full bg-black/20 hover:bg-rose-500 text-white flex items-center justify-center transition-colors text-[9px]"
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    )}
                </div>
            ) : (
                <span className="text-[9px] font-bold text-orange-400/70 uppercase tracking-wider">
                    {target.label || 'Drop Word'}
                </span>
            )}
        </div>
    );
}

export default function KidsFreeformCanvasQuestion({
    question,
    value,
    onChange,
    isReview = false
}) {
    // Parse Canvas Payload from kid_canvas relationship or question options
    const canvasConfig = useMemo(() => {
        if (question.kid_canvas?.canvas_data) {
            return typeof question.kid_canvas.canvas_data === 'string'
                ? JSON.parse(question.kid_canvas.canvas_data)
                : question.kid_canvas.canvas_data;
        }

        const firstOpt = (question.options || [])[0];
        if (!firstOpt) return null;
        try {
            return JSON.parse(firstOpt.text || firstOpt.option_text);
        } catch (e) {
            return null;
        }
    }, [question.kid_canvas, question.options]);

    const elements = canvasConfig?.elements || [];
    const targets = canvasConfig?.targets || [];
    const tokens = canvasConfig?.tokens || [];
    const instruction = canvasConfig?.instruction || '';

    // Answers mapping: { [target_id]: token_id }
    const [answers, setAnswers] = useState(() => {
        if (!value) return {};
        return typeof value === 'string' ? JSON.parse(value) : value;
    });

    const [activeToken, setActiveToken] = useState(null);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 100, tolerance: 5 },
        })
    );

    const usedTokenIds = Object.values(answers);

    const handleDragStart = (event) => {
        if (isReview) return;
        const token = tokens.find(t => t.id === event.active.id);
        setActiveToken(token || null);
    };

    const handleDragEnd = (event) => {
        if (isReview) return;
        const { active, over } = event;
        setActiveToken(null);

        if (!over) return;

        const targetId = over.id;
        const tokenId = active.id;

        const updated = { ...answers, [targetId]: tokenId };
        setAnswers(updated);
        onChange(updated);
    };

    const handleRemoveFromTarget = (targetId, directValue = null) => {
        if (isReview) return;
        const updated = { ...answers };
        if (directValue !== null) {
            updated[targetId] = directValue;
        } else {
            delete updated[targetId];
        }
        setAnswers(updated);
        onChange(updated);
    };

    const handleResetAll = () => {
        if (isReview) return;
        setAnswers({});
        onChange({});
    };

    // Separate tokens by type
    const checkTokens = tokens.filter(t => t.type === 'check');
    const crossTokens = tokens.filter(t => t.type === 'cross');
    const ringTokens = tokens.filter(t => t.type === 'ring');
    const wordTokens = tokens.filter(t => t.type === 'word');

    return (
        <div className="space-y-6">
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* 1. Instruction Banner */}
                {instruction && (
                    <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="font-black text-xs text-amber-950 tracking-wide">
                            {instruction}
                        </p>
                    </div>
                )}

                {/* 2. Sticky Draggable Token Bank */}
                <div className="sticky top-2 z-30 bg-slate-900 p-5 rounded-3xl border-2 border-amber-400/40 shadow-xl text-white">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-xs uppercase tracking-widest text-amber-400">
                                Token Bank (Tarik ke dalam kanvas)
                            </h4>
                        </div>

                        {!isReview && Object.keys(answers).length > 0 && (
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset Jawaban
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Check & Cross Tokens Group */}
                        {(checkTokens.length > 0 || crossTokens.length > 0) && (
                            <div className="flex items-center gap-2.5 p-2 bg-slate-800/90 rounded-2xl border border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Simbol Centang / Silang:</span>
                                {checkTokens.map(tok => (
                                    <DraggableTokenItem
                                        key={tok.id}
                                        token={tok}
                                        isUsed={usedTokenIds.includes(tok.id)}
                                    />
                                ))}
                                {crossTokens.map(tok => (
                                    <DraggableTokenItem
                                        key={tok.id}
                                        token={tok}
                                        isUsed={usedTokenIds.includes(tok.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Ring Tokens Group */}
                        {ringTokens.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-slate-800/90 rounded-2xl border border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Lingkaran:</span>
                                {ringTokens.map(tok => (
                                    <DraggableTokenItem
                                        key={tok.id}
                                        token={tok}
                                        isUsed={usedTokenIds.includes(tok.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Word Tokens Group */}
                        {wordTokens.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-slate-800/90 rounded-2xl border border-slate-700 flex-wrap">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Pilihan Kata:</span>
                                {wordTokens.map(tok => (
                                    <DraggableTokenItem
                                        key={tok.id}
                                        token={tok}
                                        isUsed={usedTokenIds.includes(tok.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Free-Form Canvas Rendering Area */}
                <div className="relative bg-white rounded-3xl border-4 border-slate-200 shadow-xl overflow-hidden p-6 min-h-[520px]">
                    {/* Render Canvas Elements (Text & Images) */}
                    {elements.map((el) => {
                        if (el.type === 'text') {
                            return (
                                <div
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${el.x}px`,
                                        top: `${el.y}px`,
                                        fontSize: `${el.fontSize || 18}px`,
                                        fontWeight: el.fontStyle?.includes('bold') ? 'bold' : 'normal',
                                        fontStyle: el.fontStyle?.includes('italic') ? 'italic' : 'normal',
                                        color: el.fill || '#1e293b',
                                        fontFamily: "'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                                    }}
                                    className="select-none pointer-events-none whitespace-pre"
                                >
                                    {el.text}
                                </div>
                            );
                        } else if (el.type === 'image') {
                            return (
                                <img
                                    key={el.id}
                                    src={el.src}
                                    alt="Canvas Clip-Art"
                                    style={{
                                        position: 'absolute',
                                        left: `${el.x}px`,
                                        top: `${el.y}px`,
                                        width: `${el.width || 100}px`,
                                        height: `${el.height || 100}px`,
                                    }}
                                    className="select-none pointer-events-none object-contain"
                                />
                            );
                        }
                        return null;
                    })}

                    {/* Render Droppable Canvas Targets */}
                    {targets.map((tgt) => {
                        const assignedTokenId = answers[tgt.id];
                        const assignedToken = tgt.type === 'input_target' 
                            ? assignedTokenId 
                            : tokens.find(t => t.id === assignedTokenId);

                        const isCorrect = tgt.type === 'ring_target'
                            ? assignedToken?.type === 'ring'
                            : tgt.type === 'box_target'
                            ? (tgt.correct_symbol ? assignedToken?.type === tgt.correct_symbol : (tgt.correct_token_id ? assignedToken?.type === (tgt.correct_token_id.includes('chk') ? 'check' : 'cross') : false))
                            : tgt.type === 'input_target'
                            ? (String(assignedTokenId || '').trim().toLowerCase() === String(tgt.correct_text || '').trim().toLowerCase())
                            : tgt.correct_token_id === assignedTokenId;

                        return (
                            <DroppableCanvasTarget
                                key={tgt.id}
                                target={tgt}
                                assignedToken={assignedToken}
                                onRemove={handleRemoveFromTarget}
                                isReview={isReview}
                                isCorrect={isCorrect}
                            />
                        );
                    })}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeToken ? (
                        <DraggableTokenItem token={activeToken} isOverlay={true} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
