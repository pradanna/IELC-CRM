import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { CheckCircle2, RotateCcw, Move, X, Eye } from 'lucide-react';

// Base Reference Coordinate System from Admin Studio
const BASE_WIDTH = 1100;
const BASE_HEIGHT = 1000;

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
                className={`cursor-grab active:cursor-grabbing select-none w-10 h-10 rounded-full border-3 border-emerald-500 bg-emerald-500/20 flex items-center justify-center transition-all ${
                    isDragging
                        ? 'opacity-30 border-dashed border-emerald-400 scale-95'
                        : isOverlay
                        ? 'scale-125 border-emerald-400 bg-emerald-500/40 shadow-2xl z-50 ring-4 ring-emerald-400/30'
                        : isUsed
                        ? 'opacity-20 border-slate-300 bg-slate-100 cursor-not-allowed'
                        : 'hover:scale-110 active:scale-95 shadow-sm'
                }`}
            >
                <div className="w-5 h-5 rounded-full border-2 border-emerald-600 bg-white/40" />
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
            style={{
                ...style,
                fontSize: token.fontSize ? `${token.fontSize}px` : undefined,
            }}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing select-none px-3.5 py-1.5 rounded-2xl border-2 font-black text-sm transition-all flex items-center gap-2 ${
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
            <span style={{ fontSize: token.fontSize ? `${token.fontSize}px` : undefined }}>{token.text}</span>
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

    // Example Markers (Active/Pre-answered Examples - not interactive, not scored)
    if (target.is_example || target.type === 'example_circle' || target.type === 'example_box' || target.type === 'example_word' || target.type === 'example_input') {
        if (target.type === 'example_circle') {
            const radius = target.radius || 28;
            const width = target.width || radius * 3;
            const height = target.height || radius * 2;
            const fontSize = target.fontSize || 14;
            const isRingText = !!target.label && target.label !== 'Contoh Lingkaran';

            return (
                <div
                    style={{
                        position: 'absolute',
                        left: `${target.x - width / 2}px`,
                        top: `${target.y - height / 2}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        fontSize: `${fontSize}px`,
                    }}
                    className={`z-20 rounded-full border-2.5 flex items-center justify-center select-none font-black shadow-xs ${
                        isRingText
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800'
                            : 'border-violet-500 border-dashed bg-violet-500/10 text-violet-800'
                    }`}
                >
                    <span className="truncate px-1">{target.label || 'CONTOH'}</span>
                </div>
            );
        }

        if (target.type === 'example_box') {
            const width = target.width || 36;
            const height = target.height || 36;
            const isCross = target.example_symbol === 'cross';

            return (
                <div
                    style={{
                        position: 'absolute',
                        left: `${target.x}px`,
                        top: `${target.y}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                    }}
                    className={`z-20 rounded-xl border-2 border-dashed flex items-center justify-center select-none shadow-xs ${
                        isCross
                            ? 'border-rose-400 bg-rose-50/40 text-rose-600'
                            : 'border-emerald-400 bg-emerald-50/40 text-emerald-600'
                    }`}
                >
                    <span className="font-black text-lg">
                        {isCross ? '✖' : '✔'}
                    </span>
                </div>
            );
        }

        if (target.type === 'example_word') {
            const width = target.width || 100;
            const height = target.height || 32;
            const text = target.example_text || 'Contoh';

            return (
                <div
                    style={{
                        position: 'absolute',
                        left: `${target.x}px`,
                        top: `${target.y}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                    }}
                    className="z-20 rounded-xl border-2 border-dashed border-orange-400 bg-orange-50/30 flex items-center justify-center select-none shadow-xs px-1 overflow-hidden"
                >
                    <span
                        style={{
                            fontSize: `${target.fontSize || 14}px`,
                        }}
                        className="font-black text-orange-600 truncate w-full text-center"
                    >
                        {text}
                    </span>
                </div>
            );
        }

        if (target.type === 'example_input') {
            const width = target.width || 120;
            const height = target.height || 36;
            const text = target.example_text || 'Jawaban Contoh';

            return (
                <div
                    style={{
                        position: 'absolute',
                        left: `${target.x}px`,
                        top: `${target.y}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        zIndex: 25,
                    }}
                >
                    <input
                        type="text"
                        value={text}
                        disabled
                        readOnly
                        style={{
                            fontSize: target.fontSize ? `${target.fontSize}px` : undefined,
                        }}
                        className="w-full h-full px-2.5 rounded-xl text-center font-black text-sm tracking-wide border-2 border-sky-400 bg-sky-50/60 text-sky-800 shadow-xs cursor-default select-none"
                    />
                </div>
            );
        }
    }

    if (target.type === 'ring_target') {
        const radius = target.radius || 24;
        const width = target.width || radius * 3; // radius 24 * scaleX 1.5 * 2 = 72px
        const height = target.height || radius * 2; // radius 24 * 2 = 48px
        const fontSize = target.fontSize || 16;
        return (
            <div
                ref={setNodeRef}
                onClick={() => {
                    if (!isReview && assignedToken) {
                        onRemove(target.id);
                    }
                }}
                style={{
                    position: 'absolute',
                    left: `${target.x - width / 2}px`,
                    top: `${target.y - height / 2}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    fontSize: `${fontSize}px`,
                }}
                title={!isReview && assignedToken ? "Klik untuk mengembalikan token" : undefined}
                className={`z-20 rounded-full transition-all flex items-center justify-center select-none font-semibold ${
                    !isReview && assignedToken ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                } ${
                    isOver
                        ? 'border-2 border-emerald-500 bg-emerald-400/30 backdrop-blur-sm scale-110 ring-4 ring-emerald-400/30 z-30 text-slate-900'
                        : assignedToken
                        ? isReview
                            ? isCorrect
                                ? 'border-2.5 border-emerald-500 bg-emerald-500/10 text-slate-900'
                                : 'border-2.5 border-rose-500 bg-rose-500/10 text-slate-900'
                            : 'border-2.5 border-emerald-500 bg-emerald-500/10 text-slate-900'
                        : 'border-2 border-dashed border-emerald-400/80 bg-emerald-50/20 hover:border-emerald-500 text-slate-900'
                }`}
            >
                <span>{target.label || ''}</span>
            </div>
        );
    }

    // Box Target Spot (Kotak Centang/Silang)
    if (target.type === 'box_target') {
        const width = target.width || 36;
        const height = target.height || 36;
        return (
            <div
                ref={setNodeRef}
                onClick={() => {
                    if (!isReview && assignedToken) {
                        onRemove(target.id);
                    }
                }}
                style={{
                    position: 'absolute',
                    left: `${target.x}px`,
                    top: `${target.y}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                }}
                title={!isReview && assignedToken ? "Klik untuk mengembalikan token" : undefined}
                className={`z-20 rounded-xl transition-all flex items-center justify-center select-none ${
                    !isReview && assignedToken ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                } ${
                    isOver
                        ? 'border-2 border-emerald-500 bg-emerald-400/30 backdrop-blur-sm scale-110 ring-4 ring-emerald-400/30 z-30'
                        : assignedToken
                        ? isReview
                            ? isCorrect
                                ? 'border-2 border-emerald-500 bg-emerald-500/15'
                                : 'border-2 border-rose-500 bg-rose-500/15'
                            : 'border-0 bg-transparent'
                        : 'border-2 border-dashed border-emerald-500/80 bg-emerald-50/20 hover:border-emerald-500'
                }`}
            >
                {assignedToken ? (
                    <div className="flex items-center justify-center w-full h-full pointer-events-none">
                        <span
                            className={`font-black text-lg ${
                                assignedToken.symbol === '✖' || assignedToken.id?.includes('crs')
                                    ? 'text-rose-600'
                                    : 'text-emerald-600'
                            }`}
                        >
                            {assignedToken.symbol || (assignedToken.id?.includes('crs') ? '✖' : '✔')}
                        </span>
                    </div>
                ) : null}
            </div>
        );
    }

    // Input Target Spot (Kotak Isian)
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
                    style={{
                        fontSize: target.fontSize ? `${target.fontSize}px` : undefined,
                    }}
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

    // Word Target Spot (Drop Zone Kata)
    return (
        <div
            ref={setNodeRef}
            onClick={() => {
                if (!isReview && assignedToken) {
                    onRemove(target.id);
                }
            }}
            style={{
                position: 'absolute',
                left: `${target.x}px`,
                top: `${target.y}px`,
                width: `${target.width || 100}px`,
                height: `${target.height || 30}px`,
            }}
            title={!isReview && assignedToken ? "Klik untuk mengembalikan kata ke Token Bank" : undefined}
            className={`z-20 rounded-xl transition-all flex items-center justify-center select-none overflow-hidden ${
                !isReview && assignedToken ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
            } ${
                isOver
                    ? 'border-2 border-orange-500 bg-orange-400/30 backdrop-blur-sm text-orange-950 scale-105 ring-4 ring-orange-400/30 z-30'
                    : assignedToken
                    ? isReview
                        ? isCorrect
                            ? 'border-2 border-emerald-500 bg-emerald-500/20 text-emerald-950'
                            : 'border-2 border-rose-500 bg-rose-500/20 text-rose-950'
                        : 'border-0 bg-transparent text-slate-900 font-bold'
                    : 'border-2 border-dashed border-orange-300/80 bg-orange-50/20 hover:border-orange-400'
            }`}
        >
            {assignedToken ? (
                <div className="w-full h-full flex items-center justify-center px-1 text-center pointer-events-none">
                    <span
                        style={{
                            fontSize: `${assignedToken.fontSize || target.fontSize || 14}px`,
                        }}
                        className="font-black text-orange-600 drop-shadow-xs truncate w-full"
                    >
                        {assignedToken.text}
                    </span>
                </div>
            ) : (
                <span className="text-[9px] font-bold text-orange-400/70 uppercase tracking-wider truncate px-1 pointer-events-none">
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
    const containerRef = useRef(null);
    const [canvasScale, setCanvasScale] = useState(1);

    // Responsive Canvas Resizing calculation with ResizeObserver
    useEffect(() => {
        if (!containerRef.current) return;

        const updateScale = () => {
            if (!containerRef.current) return;
            // Dapatkan lebar efektif container (dikurangi padding 16px)
            const availableWidth = containerRef.current.clientWidth - 16;
            if (availableWidth > 0) {
                // Skala otomatis: max 1.0 pada layar besar desktop, dan mengecil secara proporsional di tablet/HP
                const newScale = Math.min(1, Math.max(0.3, availableWidth / BASE_WIDTH));
                setCanvasScale(newScale);
            }
        };

        updateScale();

        // Gunakan ResizeObserver agar saat modal terbuka animasi selesai, skala langsung terhitung akurat
        const observer = new ResizeObserver(() => {
            updateScale();
        });

        observer.observe(containerRef.current);

        window.addEventListener('resize', updateScale);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateScale);
        };
    }, []);

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

        const token = tokens.find((t) => t.id === tokenId);
        const target = targets.find((t) => t.id === targetId);

        // Validasi pembatasan target jika token memiliki allowed_target_id atau allowed_target_ids
        if (token && (token.allowed_target_id || (Array.isArray(token.allowed_target_ids) && token.allowed_target_ids.length > 0))) {
            const allowedIds = Array.isArray(token.allowed_target_ids) && token.allowed_target_ids.length > 0
                ? token.allowed_target_ids
                : [token.allowed_target_id];

            if (!allowedIds.includes(targetId)) {
                // Bukan target yang diizinkan untuk token ini -> tolak drop
                return;
            }
        }

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
                        <p className="font-black text-xs text-amber-950 tracking-wide">
                            {instruction}
                        </p>
                    </div>
                )}

                {/* 2. Optional Reset Bar (Only shown if student has filled some answers or review mode) */}
                {!isReview && Object.keys(answers).length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-sm">
                        <span className="text-xs font-bold text-slate-300">
                            💡 Klik target pada kanvas untuk membatalkan jawaban, atau reset semua:
                        </span>
                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="text-[11px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-wider flex items-center gap-1.5 transition-colors bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-800/40"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset Semua
                        </button>
                    </div>
                )}

                {/* 3. Free-Form Canvas Responsive Rendering Area */}
                <div 
                    ref={containerRef}
                    className="w-full bg-slate-100 rounded-3xl border-4 border-slate-200 shadow-xl overflow-hidden flex justify-center items-center p-2"
                >
                    <div 
                        style={{
                            width: `${BASE_WIDTH * canvasScale}px`,
                            height: `${BASE_HEIGHT * canvasScale}px`,
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        className="rounded-2xl shadow-sm border border-slate-200 bg-white"
                    >
                        <div 
                            className="relative bg-white shrink-0 origin-top-left"
                            style={{
                                width: `${BASE_WIDTH}px`,
                                height: `${BASE_HEIGHT}px`,
                                transform: `scale(${canvasScale})`,
                                transformOrigin: 'top left',
                            }}
                        >
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
                                            textAlign: el.align || 'left',
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
                                ? assignedToken?.type === 'ring' && (tgt.is_correct_answer !== false)
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

                        {/* Render Draggable Tokens Directly on the Canvas */}
                        {tokens.map((tok) => {
                            const isUsed = usedTokenIds.includes(tok.id);
                            const x = typeof tok.x === 'number' ? tok.x : 880;
                            const y = typeof tok.y === 'number' ? tok.y : 120;

                            return (
                                <div
                                    key={tok.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${x}px`,
                                        top: `${y}px`,
                                        zIndex: 35,
                                    }}
                                    className="transition-opacity duration-200"
                                >
                                    <DraggableTokenItem
                                        token={tok}
                                        isUsed={isUsed}
                                    />
                                </div>
                            );
                        })}
                        </div>
                    </div>
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
