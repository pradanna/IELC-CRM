import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Circle, Line, Group, Transformer } from 'react-konva';
import {
    Type,
    Image as ImageIcon,
    Plus,
    Trash2,
    Move,
    RotateCcw,
    Sliders,
    Layers,
    Bold,
    Italic,
    X,
    MousePointer,
    CheckCircle2,
    Eye,
    Undo2,
    Redo2
} from 'lucide-react';
import TextInput from '@/Components/form/TextInput';
import InputLabel from '@/Components/form/InputLabel';

// Helper hook for loading HTML images into Konva
const useKonvaImage = (url) => {
    const [image, setImage] = useState(null);
    useEffect(() => {
        if (!url) {
            setImage(null);
            return;
        }
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => setImage(img);
    }, [url]);
    return image;
};

// Render Individual Konva Image Element with Drag and Transform
const CanvasImageItem = ({ element, isSelected, onSelect, onChange }) => {
    const image = useKonvaImage(element.src);
    const shapeRef = useRef(null);

    return (
        <KonvaImage
            id={element.id}
            ref={shapeRef}
            image={image}
            x={element.x}
            y={element.y}
            width={element.width || 120}
            height={element.height || 100}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
                onChange({
                    ...element,
                    x: e.target.x(),
                    y: e.target.y()
                });
            }}
            onTransformEnd={() => {
                const node = shapeRef.current;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1);
                node.scaleY(1);
                onChange({
                    ...element,
                    x: node.x(),
                    y: node.y(),
                    width: Math.round(Math.max(20, node.width() * scaleX)),
                    height: Math.round(Math.max(20, node.height() * scaleY))
                });
            }}
        />
    );
};

export default function KidsFreeformCanvasStudio({ value, onChange }) {
    const stageWidth = 920;
    const stageHeight = 560;

    // Initial Canvas State (Start Clean / Blank)
    const [canvasState, setCanvasState] = useState(() => {
        if (value) {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            if (parsed && (parsed.elements !== undefined || parsed.targets !== undefined)) {
                return parsed;
            }
        }

        // Clean Blank Canvas Starter
        return {
            mode: 'freeform_canvas',
            instruction: '',
            tokens: [],
            elements: [],
            targets: []
        };
    });

    const [selectedIds, setSelectedIds] = useState([]); // Array of selected element IDs
    const [selectedTargetIds, setSelectedTargetIds] = useState([]); // Array of selected target IDs
    const [activeTab, setActiveTab] = useState('elements'); // 'elements' | 'targets' | 'tokens'
    const [newWordInput, setNewWordInput] = useState('');
    const [editingTextId, setEditingTextId] = useState(null);
    const [editingTextValue, setEditingTextValue] = useState('');
    const [editingTargetId, setEditingTargetId] = useState(null);
    const [editingTargetValue, setEditingTargetValue] = useState('');
    const trRef = useRef(null);
    const stageRef = useRef(null);
    const textInputRef = useRef(null);
    const targetInputRef = useRef(null);

    // Undo / Redo History Stack
    const [history, setHistory] = useState([canvasState]);
    const [historyStep, setHistoryStep] = useState(0);

    const pushHistory = (newState) => {
        setHistory(prev => {
            const nextHistory = prev.slice(0, historyStep + 1);
            return [...nextHistory, newState];
        });
        setHistoryStep(prev => prev + 1);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            setCanvasState(history[prevStep]);
            setSelectedIds([]);
            setSelectedTargetIds([]);
            setEditingTextId(null);
            setEditingTargetId(null);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            const nextStep = historyStep + 1;
            setHistoryStep(nextStep);
            setCanvasState(history[nextStep]);
            setSelectedIds([]);
            setSelectedTargetIds([]);
            setEditingTextId(null);
            setEditingTargetId(null);
        }
    };

    // Helper updater with history tracking
    const updateCanvasStateWithHistory = (updater) => {
        setCanvasState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
            pushHistory(next);
            return next;
        });
    };

    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
    const selectedTargetId = selectedTargetIds.length === 1 ? selectedTargetIds[0] : null;

    const setSelectedId = (id) => {
        setSelectedIds(id ? [id] : []);
    };

    const setSelectedTargetId = (id) => {
        setSelectedTargetIds(id ? [id] : []);
    };

    // Synchronize to Parent Form
    useEffect(() => {
        onChange(canvasState);
    }, [canvasState]);

    // Focus & select text when entering inline edit mode
    useEffect(() => {
        if (editingTextId && textInputRef.current) {
            textInputRef.current.focus();
            textInputRef.current.select();
        }
    }, [editingTextId]);

    // Focus & select target when entering inline edit mode
    useEffect(() => {
        if (editingTargetId && targetInputRef.current) {
            targetInputRef.current.focus();
            targetInputRef.current.select();
        }
    }, [editingTargetId]);

    // Handle selection transformer (supports multi-selection for elements & targets!)
    useEffect(() => {
        if (!trRef.current || !stageRef.current) return;
        if ((selectedIds.length === 0 && selectedTargetIds.length === 0) || editingTextId || editingTargetId) {
            trRef.current.nodes([]);
            trRef.current.getLayer()?.batchDraw();
            return;
        }

        const elementNodes = selectedIds
            .map(id => stageRef.current.findOne('#' + id))
            .filter(Boolean);

        const targetNodes = selectedTargetIds
            .map(id => stageRef.current.findOne('#' + id))
            .filter(Boolean);

        trRef.current.nodes([...elementNodes, ...targetNodes]);
        trRef.current.getLayer()?.batchDraw();
    }, [selectedIds, selectedTargetIds, editingTextId, editingTargetId, canvasState.elements, canvasState.targets]);

    // Inline Text Editing Actions
    const handleStartEditText = (el) => {
        setSelectedIds([el.id]);
        setSelectedTargetIds([]);
        setActiveTab('elements');
        setEditingTargetId(null);
        setEditingTextId(el.id);
        setEditingTextValue(el.text || '');
    };

    const handleFinishEditText = () => {
        if (editingTextId) {
            const trimmed = editingTextValue;
            handleUpdateElement(editingTextId, { text: trimmed });
            setEditingTextId(null);
        }
    };

    // Inline Target Label / Word Editing Actions (Double-Click on Word Spot / Input Spot)
    const handleStartEditTarget = (tgt) => {
        setSelectedTargetIds([tgt.id]);
        setSelectedIds([]);
        setActiveTab('targets');
        setEditingTextId(null);
        setEditingTargetId(tgt.id);
        if (tgt.type === 'input_target') {
            setEditingTargetValue(tgt.correct_text || tgt.label || '');
        } else {
            setEditingTargetValue(tgt.label || '');
        }
    };

    const handleFinishEditTarget = () => {
        if (editingTargetId) {
            const tgt = canvasState.targets.find(t => t.id === editingTargetId);
            if (tgt) {
                if (tgt.type === 'input_target') {
                    handleUpdateTarget(editingTargetId, { correct_text: editingTargetValue, label: editingTargetValue || tgt.label });
                } else {
                    handleUpdateTarget(editingTargetId, { label: editingTargetValue });
                }
            }
            setEditingTargetId(null);
        }
    };

    // 1. Add Text Element
    const handleAddText = () => {
        const newId = `txt_${Date.now()}`;
        const newElem = {
            id: newId,
            type: 'text',
            text: 'Teks Baru (Double click / edit)',
            x: 100,
            y: 100,
            fontSize: 18,
            fontStyle: 'normal',
            fill: '#1e293b'
        };
        setCanvasState(prev => ({
            ...prev,
            elements: [...prev.elements, newElem]
        }));
        setSelectedId(newId);
        // Langsung aktifkan mode edit teks agar kursor langsung masuk
        handleStartEditText(newElem);
    };

    const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

    // Helper: proses file gambar menjadi elemen canvas dengan dimensi proporsional
    const processImageFile = (file, dropX = 150, dropY = 150) => {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const tempImg = new window.Image();
            tempImg.src = dataUrl;
            tempImg.onload = () => {
                // Hitung dimensi yang pas di canvas (maksimal lebar/tinggi ~180px dengan menjaga aspect ratio)
                const maxDim = 180;
                let w = tempImg.naturalWidth || 120;
                let h = tempImg.naturalHeight || 100;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h / w) * maxDim);
                        w = maxDim;
                    } else {
                        w = Math.round((w / h) * maxDim);
                        h = maxDim;
                    }
                }

                // Posisi center pada titik drop
                const finalX = Math.max(10, Math.min(stageWidth - w - 10, dropX - w / 2));
                const finalY = Math.max(10, Math.min(stageHeight - h - 10, dropY - h / 2));

                const newId = `img_${Date.now()}`;
                const newElem = {
                    id: newId,
                    type: 'image',
                    src: dataUrl,
                    x: Math.round(finalX),
                    y: Math.round(finalY),
                    width: w,
                    height: h
                };
                setCanvasState(prev => ({
                    ...prev,
                    elements: [...prev.elements, newElem]
                }));
                setSelectedId(newId);
                setActiveTab('elements');
            };
        };
        reader.readAsDataURL(file);
    };

    // Select All Elements & Targets (Ctrl+A)
    const handleSelectAll = () => {
        const allElementIds = canvasState.elements.map(el => el.id);
        const allTargetIds = canvasState.targets.map(tgt => tgt.id);
        setSelectedIds(allElementIds);
        setSelectedTargetIds(allTargetIds);
        setActiveTab('elements');
    };

    // Duplicate Selected Items (Supports single & multiple selection)
    const handleDuplicateSelected = () => {
        let newElementIds = [];
        let newTargetIds = [];

        // Duplicate selected elements (text / image)
        if (selectedIds.length > 0) {
            const duplicatedElements = [];
            canvasState.elements.forEach(el => {
                if (selectedIds.includes(el.id)) {
                    const newId = `${el.type === 'text' ? 'txt' : 'img'}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                    newElementIds.push(newId);
                    duplicatedElements.push({
                        ...el,
                        id: newId,
                        x: Math.min(stageWidth - (el.width || 120), el.x + 20),
                        y: Math.min(stageHeight - (el.height || 40), el.y + 20)
                    });
                }
            });

            if (duplicatedElements.length > 0) {
                setCanvasState(prev => ({
                    ...prev,
                    elements: [...prev.elements, ...duplicatedElements]
                }));
            }
        }

        // Duplicate selected drop targets
        if (selectedTargetIds.length > 0) {
            const duplicatedTargets = [];
            canvasState.targets.forEach(tgt => {
                if (selectedTargetIds.includes(tgt.id)) {
                    const newId = `tgt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                    newTargetIds.push(newId);
                    duplicatedTargets.push({
                        ...tgt,
                        id: newId,
                        label: `${tgt.label || 'Target'} (Copy)`,
                        x: Math.min(stageWidth - (tgt.width || 60), tgt.x + 20),
                        y: Math.min(stageHeight - (tgt.height || 40), tgt.y + 20)
                    });
                }
            });

            if (duplicatedTargets.length > 0) {
                setCanvasState(prev => ({
                    ...prev,
                    targets: [...prev.targets, ...duplicatedTargets]
                }));
            }
        }

        if (newElementIds.length > 0) {
            setSelectedIds(newElementIds);
            setActiveTab('elements');
        }
        if (newTargetIds.length > 0) {
            setSelectedTargetIds(newTargetIds);
            if (newElementIds.length === 0) setActiveTab('targets');
        }
    };

    // Keyboard Shortcuts (Ctrl+Z undo, Ctrl+Y redo, Ctrl+A select all, Ctrl+D duplicate, Delete/Backspace remove)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Jangan jalankan shortcut jika sedang mengetik di input/textarea
            const tag = e.target.tagName.toLowerCase();
            const isEditingInput = tag === 'input' || tag === 'textarea';

            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey && !isEditingInput) {
                e.preventDefault();
                handleUndo();
            } else if (((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))) && !isEditingInput) {
                e.preventDefault();
                handleRedo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A') && !isEditingInput) {
                e.preventDefault();
                handleSelectAll();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D') && !isEditingInput) {
                e.preventDefault();
                handleDuplicateSelected();
            } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingInput) {
                if (selectedIds.length > 0 || selectedTargetIds.length > 0) {
                    e.preventDefault();
                    updateCanvasStateWithHistory(prev => ({
                        ...prev,
                        elements: prev.elements.filter(el => !selectedIds.includes(el.id)),
                        targets: prev.targets.filter(tgt => !selectedTargetIds.includes(tgt.id))
                    }));
                    setSelectedIds([]);
                    setSelectedTargetIds([]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, selectedTargetIds, canvasState, history, historyStep, stageWidth, stageHeight]);

    // Paste from Clipboard (Ctrl+V) handler
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        e.preventDefault();
                        processImageFile(file, stageWidth / 2, stageHeight / 2);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [stageWidth, stageHeight]);

    // Handle Drop file gambar dari luar / file explorer ke Canvas
    const handleCanvasDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverCanvas(false);

        if (!stageRef.current) return;
        stageRef.current.setPointersPositions(e);
        const pointerPos = stageRef.current.getPointerPosition() || { x: stageWidth / 2, y: stageHeight / 2 };

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                if (files[i].type.startsWith('image/')) {
                    // Staggering jika drop banyak file sekaligus
                    const offsetX = pointerPos.x + (i * 20);
                    const offsetY = pointerPos.y + (i * 20);
                    processImageFile(files[i], offsetX, offsetY);
                }
            }
        }
    };

    const handleCanvasDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOverCanvas) setIsDragOverCanvas(true);
    };

    const handleCanvasDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverCanvas(false);
    };

    // 2. Add Image Element via file input button
    const handleAddImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processImageFile(file, 150, 150);
        e.target.value = '';
    };

    // 3. Add Drop Target (Ring Target, Word Target, or Box Target for Checkmark/Cross)
    const handleAddTarget = (type) => {
        const newId = `tgt_${Date.now()}`;
        let newTarget;
        if (type === 'ring_target') {
            newTarget = {
                id: newId,
                type: 'ring_target',
                x: 200,
                y: 200,
                radius: 24,
                correct_token_type: 'ring',
                label: 'Ring Spot'
            };
        } else if (type === 'box_target') {
            newTarget = {
                id: newId,
                type: 'box_target',
                x: 350,
                y: 200,
                width: 36,
                height: 36,
                correct_symbol: 'check', // 'check' (True/Centang) | 'cross' (False/Silang)
                label: 'Kotak True/False'
            };
        } else if (type === 'input_target') {
            newTarget = {
                id: newId,
                type: 'input_target',
                x: 300,
                y: 200,
                width: 120,
                height: 36,
                correct_text: '',
                label: 'Isian Teks (Ketik)',
                placeholder: 'Ketik jawaban...'
            };
        } else {
            const firstWordId = canvasState.tokens.find(t => t.type === 'word')?.id || '';
            newTarget = {
                id: newId,
                type: 'word_target',
                x: 300,
                y: 200,
                width: 100,
                height: 32,
                correct_token_id: firstWordId,
                label: 'Word Spot'
            };
        }
        setCanvasState(prev => ({
            ...prev,
            targets: [...prev.targets, newTarget]
        }));
        setSelectedTargetId(newId);
        setActiveTab('targets');
    };

    // 4. Update Element Properties
    const handleUpdateElement = (id, newProps) => {
        setCanvasState(prev => ({
            ...prev,
            elements: prev.elements.map(el => el.id === id ? { ...el, ...newProps } : el)
        }));
    };

    // 5. Delete Element
    const handleDeleteElement = (id) => {
        setCanvasState(prev => ({
            ...prev,
            elements: prev.elements.filter(el => el.id !== id)
        }));
        if (selectedId === id) setSelectedId(null);
    };

    // 6. Update Target Properties
    const handleUpdateTarget = (id, newProps) => {
        setCanvasState(prev => ({
            ...prev,
            targets: prev.targets.map(t => t.id === id ? { ...t, ...newProps } : t)
        }));
    };

    // 7. Delete Target
    const handleDeleteTarget = (id) => {
        setCanvasState(prev => ({
            ...prev,
            targets: prev.targets.filter(t => t.id !== id)
        }));
        if (selectedTargetId === id) setSelectedTargetId(null);
    };

    // 8. Add Word Token
    const handleAddWordToken = (e) => {
        e?.preventDefault();
        const text = newWordInput.trim();
        if (!text) return;

        const newId = `tok_w_${Date.now()}`;
        setCanvasState(prev => ({
            ...prev,
            tokens: [...prev.tokens, { id: newId, type: 'word', text, color: '#ea580c' }]
        }));
        setNewWordInput('');
    };

    // 9. Add Ring Token
    const handleAddRingToken = () => {
        const ringCount = canvasState.tokens.filter(t => t.type === 'ring').length + 1;
        const newId = `tok_ring_${Date.now()}`;
        setCanvasState(prev => ({
            ...prev,
            tokens: [...prev.tokens, { id: newId, type: 'ring', label: `🟢 Ring Hijau #${ringCount}`, color: '#22c55e' }]
        }));
    };

    // 9b. Add Checkmark Token (Centang Hijau)
    const handleAddCheckToken = () => {
        const checkCount = canvasState.tokens.filter(t => t.type === 'check').length + 1;
        const newId = `tok_chk_${Date.now()}`;
        setCanvasState(prev => ({
            ...prev,
            tokens: [...prev.tokens, { id: newId, type: 'check', label: `✔ Centang #${checkCount}`, symbol: '✔', color: '#16a34a' }]
        }));
    };

    // 9c. Add Cross Token (Silang Merah)
    const handleAddCrossToken = () => {
        const crossCount = canvasState.tokens.filter(t => t.type === 'cross').length + 1;
        const newId = `tok_crs_${Date.now()}`;
        setCanvasState(prev => ({
            ...prev,
            tokens: [...prev.tokens, { id: newId, type: 'cross', label: `✖ Silang #${crossCount}`, symbol: '✖', color: '#dc2626' }]
        }));
    };

    // 10. Delete Token
    const handleDeleteToken = (id) => {
        setCanvasState(prev => ({
            ...prev,
            tokens: prev.tokens.filter(t => t.id !== id),
            targets: prev.targets.map(tgt => tgt.correct_token_id === id ? { ...tgt, correct_token_id: '' } : tgt)
        }));
    };

    const selectedElement = canvasState.elements.find(el => el.id === selectedId);
    const selectedTarget = canvasState.targets.find(t => t.id === selectedTargetId);

    return (
        <div className="space-y-4 bg-slate-100/90 text-slate-800 p-6 rounded-3xl border border-slate-200 shadow-sm">
            {/* Top Bar / Tools */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                            Kids Free-Form Canvas Studio
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                            Rancang soal secara bebas di atas kanvas: tambah teks, gambar, sasaran kotak centang/silang, lingkaran, dan kata.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Undo / Redo Buttons */}
                    <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 shadow-sm mr-1">
                        <button
                            type="button"
                            onClick={handleUndo}
                            disabled={historyStep <= 0}
                            title="Undo (Ctrl+Z)"
                            className={`p-1.5 rounded-lg transition-colors ${
                                historyStep > 0 ? 'text-slate-700 hover:bg-slate-100 cursor-pointer' : 'text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleRedo}
                            disabled={historyStep >= history.length - 1}
                            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                            className={`p-1.5 rounded-lg transition-colors ${
                                historyStep < history.length - 1 ? 'text-slate-700 hover:bg-slate-100 cursor-pointer' : 'text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add Text */}
                    <button
                        type="button"
                        onClick={handleAddText}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm"
                    >
                        <Type className="w-4 h-4 text-sky-600" />
                        <span>+ Teks</span>
                    </button>

                    {/* Add Image */}
                    <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm cursor-pointer">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span>+ Gambar</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAddImage}
                            className="hidden"
                        />
                    </label>

                    {/* Add Checkbox Target Box */}
                    <button
                        type="button"
                        onClick={() => handleAddTarget('box_target')}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm"
                    >
                        <span className="w-3.5 h-3.5 border-2 border-emerald-600 rounded-sm inline-flex items-center justify-center text-[9px] font-black text-emerald-600">✓</span>
                        <span>+ Centang/Silang</span>
                    </button>

                    {/* Add Text Input Box (Ketik Jawaban) */}
                    <button
                        type="button"
                        onClick={() => handleAddTarget('input_target')}
                        className="px-3.5 py-2 bg-white hover:bg-sky-50 text-sky-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-sky-300 transition-all shadow-sm"
                    >
                        <span className="w-3.5 h-3 border border-sky-600 rounded-xs inline-flex items-center justify-center text-[8px] font-black text-sky-600 bg-sky-50">|</span>
                        <span>+ Kotak Ketik (Isian)</span>
                    </button>

                    {/* Add Ring Target Spot */}
                    <button
                        type="button"
                        onClick={() => handleAddTarget('ring_target')}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm"
                    >
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 inline-block" />
                        <span>+ Ring</span>
                    </button>

                    {/* Add Word Target Spot */}
                    <button
                        type="button"
                        onClick={() => handleAddTarget('word_target')}
                        className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm"
                    >
                        <span className="w-3.5 h-2 border-b-2 border-amber-500 inline-block" />
                        <span>+ Kata</span>
                    </button>
                </div>
            </div>

            {/* Instruction Banner */}
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Instruksi / Petunjuk Soal (Tampil di atas kanvas siswa):
                </label>
                <TextInput
                    value={canvasState.instruction}
                    onChange={(e) => setCanvasState(prev => ({ ...prev, instruction: e.target.value }))}
                    placeholder="Contoh: Taruh lingkaran hijau di kata yang benar..."
                    className="!bg-white !border-slate-300 !text-slate-800 !py-2 !text-xs font-bold w-full shadow-sm"
                />
            </div>

            {/* Main Studio Grid: Canvas Workspace (Left) & Inspector / Token Panel (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1. Interactive Konva Canvas (8 Cols) */}
                <div className="lg:col-span-8 space-y-2">
                    <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-700">
                                <MousePointer className="w-3.5 h-3.5 text-amber-600" />
                                <span><b>Ctrl+Z</b> Undo</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span><b>Ctrl+Y</b> Redo</span>
                            <span className="text-slate-300">•</span>
                            <span><b>Ctrl+A</b> Pilih Semua</span>
                            <span className="text-slate-300">•</span>
                            <span><b>Ctrl+D</b> Duplikat</span>
                            <span className="text-slate-300">•</span>
                            <span><b>Ctrl+V</b> Tempel Gambar</span>
                            <span className="text-slate-300">•</span>
                            <span><b>Del</b> Hapus</span>
                        </span>
                        <span className="shrink-0 text-slate-400 font-mono">{stageWidth} x {stageHeight} px</span>
                    </div>

                    <div
                        onDrop={handleCanvasDrop}
                        onDragOver={handleCanvasDragOver}
                        onDragLeave={handleCanvasDragLeave}
                        className={`relative bg-white rounded-3xl p-3 shadow-2xl border-4 transition-all overflow-x-auto overflow-y-hidden flex items-center justify-start lg:justify-center ${
                            isDragOverCanvas ? 'border-amber-500 ring-4 ring-amber-500/20 bg-amber-50/20' : 'border-slate-700/80'
                        }`}
                    >
                        {/* Drag & Drop Overlay Indicator */}
                        {isDragOverCanvas && (
                            <div className="absolute inset-0 z-30 bg-amber-500/10 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-amber-500 rounded-2xl pointer-events-none">
                                <div className="p-4 bg-white/95 rounded-2xl shadow-xl border border-amber-200 flex items-center gap-3 animate-bounce">
                                    <ImageIcon className="w-8 h-8 text-amber-600" />
                                    <div>
                                        <p className="text-sm font-black text-slate-800">Lepaskan File Gambar Di Sini</p>
                                        <p className="text-xs text-slate-500">Gambar akan langsung ditempelkan ke titik kursor Anda</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Stage
                            ref={stageRef}
                            width={stageWidth}
                            height={stageHeight}
                            onMouseDown={(e) => {
                                if (e.target === e.target.getStage() || e.target.name?.() === 'bg_rect') {
                                    setSelectedIds([]);
                                    setSelectedTargetIds([]);
                                }
                            }}
                            className="bg-white rounded-2xl cursor-default select-none shadow-inner"
                        >
                            <Layer>
                                {/* Background Canvas Paper */}
                                <Rect
                                    name="bg_rect"
                                    x={0}
                                    y={0}
                                    width={stageWidth}
                                    height={stageHeight}
                                    fill="#ffffff"
                                />

                                {/* Empty Canvas Guide */}
                                {canvasState.elements.length === 0 && canvasState.targets.length === 0 && (
                                    <KonvaText
                                        text="Kanvas Bersih / Kosong. Klik tombol [+ Tambah Teks], [+ Upload Gambar], [+ Target Ring], atau [+ Target Kata] di toolbar atas untuk mulai menyusun soal."
                                        x={60}
                                        y={stageHeight / 2 - 20}
                                        width={stageWidth - 120}
                                        align="center"
                                        fontSize={14}
                                        fontStyle="italic"
                                        fill="#94a3b8"
                                        listening={false}
                                    />
                                )}

                                {/* Render Canvas Elements (Text & Images) */}
                                {canvasState.elements.map((el) => {
                                    if (el.type === 'text') {
                                        const isEditing = editingTextId === el.id;
                                        return (
                                            <KonvaText
                                                key={el.id}
                                                id={el.id}
                                                text={el.text}
                                                x={el.x}
                                                y={el.y}
                                                visible={!isEditing}
                                                fontSize={el.fontSize || 18}
                                                fontStyle={el.fontStyle || 'normal'}
                                                fontFamily="'Comic Sans MS', 'Outfit', 'Inter', sans-serif"
                                                fill={el.fill || '#1e293b'}
                                                draggable={!isEditing}
                                                onClick={() => {
                                                    setSelectedId(el.id);
                                                    setSelectedTargetId(null);
                                                    setActiveTab('elements');
                                                }}
                                                onTap={() => {
                                                    setSelectedId(el.id);
                                                    setSelectedTargetId(null);
                                                    setActiveTab('elements');
                                                }}
                                                onDblClick={() => handleStartEditText(el)}
                                                onDblTap={() => handleStartEditText(el)}
                                                onDragEnd={(e) => {
                                                    handleUpdateElement(el.id, {
                                                        x: e.target.x(),
                                                        y: e.target.y()
                                                    });
                                                }}
                                            />
                                        );
                                    } else if (el.type === 'image') {
                                        return (
                                            <CanvasImageItem
                                                key={el.id}
                                                element={el}
                                                isSelected={selectedId === el.id}
                                                onSelect={() => {
                                                    setSelectedId(el.id);
                                                    setSelectedTargetId(null);
                                                    setActiveTab('elements');
                                                }}
                                                onChange={(newProps) => handleUpdateElement(el.id, newProps)}
                                            />
                                        );
                                    }
                                    return null;
                                })}

                                {/* Render Interactive Target Spots */}
                                {canvasState.targets.map((tgt) => {
                                    const isTargetSelected = selectedTargetIds.includes(tgt.id);

                                    if (tgt.type === 'ring_target') {
                                        return (
                                            <Group
                                                key={tgt.id}
                                                id={tgt.id}
                                                x={tgt.x}
                                                y={tgt.y}
                                                draggable
                                                onClick={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onTap={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onDragEnd={(e) => {
                                                    handleUpdateTarget(tgt.id, {
                                                        x: e.target.x(),
                                                        y: e.target.y()
                                                    });
                                                }}
                                            >
                                                {/* Ellipse Ring Target */}
                                                <Circle
                                                    radius={tgt.radius || 24}
                                                    scaleX={1.5}
                                                    stroke="#22c55e"
                                                    strokeWidth={isTargetSelected ? 4 : 2.5}
                                                    dash={[6, 4]}
                                                    fill="rgba(34, 197, 94, 0.1)"
                                                />
                                                <KonvaText
                                                    text="⭕ Target"
                                                    fontSize={9}
                                                    fontStyle="bold"
                                                    fill="#15803d"
                                                    offsetX={18}
                                                    offsetY={5}
                                                />
                                            </Group>
                                        );
                                    } else if (tgt.type === 'box_target') {
                                        return (
                                            <Group
                                                key={tgt.id}
                                                id={tgt.id}
                                                x={tgt.x}
                                                y={tgt.y}
                                                draggable
                                                onClick={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onTap={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onDragEnd={(e) => {
                                                    handleUpdateTarget(tgt.id, {
                                                        x: e.target.x(),
                                                        y: e.target.y()
                                                    });
                                                }}
                                            >
                                                <Rect
                                                    width={tgt.width || 36}
                                                    height={tgt.height || 36}
                                                    stroke="#16a34a"
                                                    strokeWidth={isTargetSelected ? 3 : 2}
                                                    dash={[4, 3]}
                                                    cornerRadius={6}
                                                    fill="rgba(22, 163, 74, 0.08)"
                                                />
                                                <KonvaText
                                                    text="✓/✗"
                                                    fontSize={11}
                                                    fontStyle="bold"
                                                    fill="#15803d"
                                                    x={8}
                                                    y={11}
                                                />
                                            </Group>
                                        );
                                    } else if (tgt.type === 'input_target') {
                                        const isEditingTgt = editingTargetId === tgt.id;
                                        return (
                                            <Group
                                                key={tgt.id}
                                                id={tgt.id}
                                                x={tgt.x}
                                                y={tgt.y}
                                                draggable={!isEditingTgt}
                                                visible={!isEditingTgt}
                                                onClick={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onTap={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onDblClick={() => handleStartEditTarget(tgt)}
                                                onDblTap={() => handleStartEditTarget(tgt)}
                                                onDragEnd={(e) => {
                                                    handleUpdateTarget(tgt.id, {
                                                        x: e.target.x(),
                                                        y: e.target.y()
                                                    });
                                                }}
                                            >
                                                <Rect
                                                    width={tgt.width || 120}
                                                    height={tgt.height || 36}
                                                    stroke="#0284c7"
                                                    strokeWidth={isTargetSelected ? 3 : 2}
                                                    cornerRadius={8}
                                                    fill="#f0f9ff"
                                                />
                                                <KonvaText
                                                    text={tgt.correct_text ? `⌨ "${tgt.correct_text}"` : '⌨ [Kotak Ketik]'}
                                                    fontSize={11}
                                                    fontStyle="bold"
                                                    fill="#0369a1"
                                                    x={8}
                                                    y={11}
                                                />
                                            </Group>
                                        );
                                    } else if (tgt.type === 'word_target') {
                                        const isEditingTgt = editingTargetId === tgt.id;
                                        return (
                                            <Group
                                                key={tgt.id}
                                                id={tgt.id}
                                                x={tgt.x}
                                                y={tgt.y}
                                                draggable={!isEditingTgt}
                                                visible={!isEditingTgt}
                                                onClick={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onTap={() => {
                                                    setSelectedTargetId(tgt.id);
                                                    setSelectedId(null);
                                                    setActiveTab('targets');
                                                }}
                                                onDblClick={() => handleStartEditTarget(tgt)}
                                                onDblTap={() => handleStartEditTarget(tgt)}
                                                onDragEnd={(e) => {
                                                    handleUpdateTarget(tgt.id, {
                                                        x: e.target.x(),
                                                        y: e.target.y()
                                                    });
                                                }}
                                            >
                                                <Rect
                                                    width={tgt.width || 100}
                                                    height={tgt.height || 30}
                                                    stroke="#ea580c"
                                                    strokeWidth={isTargetSelected ? 3 : 2}
                                                    dash={[5, 4]}
                                                    cornerRadius={8}
                                                    fill="rgba(234, 88, 12, 0.08)"
                                                />
                                                <KonvaText
                                                    text={`[ ${tgt.label || 'Drop Word'} ]`}
                                                    fontSize={10}
                                                    fontStyle="bold"
                                                    fill="#c2410c"
                                                    x={8}
                                                    y={8}
                                                />
                                            </Group>
                                        );
                                    }
                                    return null;
                                })}

                                {/* Transformer */}
                                <Transformer
                                    ref={trRef}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        if (newBox.width < 10 || newBox.height < 10) return oldBox;
                                        return newBox;
                                    }}
                                />
                            </Layer>
                        </Stage>

                        {/* Floating Direct Inline Text Editor (Double-Click / 2x Klik Teks) */}
                        {editingTextId && (() => {
                            const editingEl = canvasState.elements.find(el => el.id === editingTextId && el.type === 'text');
                            if (!editingEl) return null;

                            return (
                                <textarea
                                    ref={textInputRef}
                                    value={editingTextValue}
                                    onChange={(e) => {
                                        setEditingTextValue(e.target.value);
                                        handleUpdateElement(editingTextId, { text: e.target.value });
                                    }}
                                    onBlur={handleFinishEditText}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleFinishEditText();
                                        } else if (e.key === 'Escape') {
                                            handleFinishEditText();
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: `${editingEl.x + 12}px`,
                                        top: `${editingEl.y + 12}px`,
                                        fontSize: `${editingEl.fontSize || 18}px`,
                                        fontStyle: editingEl.fontStyle?.includes('italic') ? 'italic' : 'normal',
                                        fontWeight: editingEl.fontStyle?.includes('bold') ? 'bold' : 'normal',
                                        fontFamily: "'Comic Sans MS', 'Outfit', 'Inter', sans-serif",
                                        color: editingEl.fill || '#1e293b',
                                        lineHeight: 1.2,
                                        zIndex: 40,
                                        minWidth: '120px',
                                        minHeight: `${(editingEl.fontSize || 18) * 1.5}px`
                                    }}
                                    className="bg-white/95 border-2 border-amber-500 rounded-lg p-1.5 shadow-2xl outline-none ring-4 ring-amber-500/20 resize"
                                    placeholder="Ketik teks di sini..."
                                />
                            );
                        })()}

                        {/* Floating Direct Target / Word Spot Editor (Double-Click / 2x Klik Word Spot) */}
                        {editingTargetId && (() => {
                            const editingTgt = canvasState.targets.find(t => t.id === editingTargetId);
                            if (!editingTgt) return null;

                            const isInputTgt = editingTgt.type === 'input_target';

                            return (
                                <input
                                    ref={targetInputRef}
                                    type="text"
                                    value={editingTargetValue}
                                    onChange={(e) => {
                                        setEditingTargetValue(e.target.value);
                                        if (isInputTgt) {
                                            handleUpdateTarget(editingTargetId, { correct_text: e.target.value, label: e.target.value || editingTgt.label });
                                        } else {
                                            handleUpdateTarget(editingTargetId, { label: e.target.value });
                                        }
                                    }}
                                    onBlur={handleFinishEditTarget}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === 'Escape') {
                                            e.preventDefault();
                                            handleFinishEditTarget();
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: `${editingTgt.x + 12}px`,
                                        top: `${editingTgt.y + 12}px`,
                                        width: `${Math.max(120, editingTgt.width || 100)}px`,
                                        height: `${editingTgt.height || 32}px`,
                                        zIndex: 40,
                                    }}
                                    className={`bg-white border-2 rounded-lg px-2 text-xs font-black shadow-2xl outline-none ring-4 ${
                                        isInputTgt 
                                            ? 'border-sky-500 text-sky-950 ring-sky-500/20' 
                                            : 'border-amber-500 text-amber-950 ring-amber-500/20'
                                    }`}
                                    placeholder={isInputTgt ? "Kunci jawaban..." : "Label Word Spot..."}
                                />
                            );
                        })()}
                    </div>

                    {/* Live Token Bank Preview Bar (Tampilan Token Yang Diberikan ke Siswa) */}
                    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                                <span>🎒</span> Bank Token Siswa ({canvasState.tokens.length} Token Aktif)
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                                (Item yang akan ditarik siswa saat ujian)
                            </span>
                        </div>

                        {canvasState.tokens.length === 0 ? (
                            <div className="py-2.5 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs font-medium">
                                Belum ada token. Klik tombol <b>[+ Centang]</b>, <b>[+ Silang]</b>, atau tambah kata di tab <b>Token Bank</b> di sebelah kanan.
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                {canvasState.tokens.map((tok) => (
                                    <div
                                        key={tok.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-xs shadow-xs select-none ${
                                            tok.type === 'check'
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                : tok.type === 'cross'
                                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                : tok.type === 'ring'
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                                : 'bg-orange-50 border-orange-300 text-orange-800'
                                        }`}
                                    >
                                        <span>{tok.symbol ? `${tok.symbol} ` : ''}{tok.text || tok.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Inspector / Settings Tabs (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Navigation Tabs */}
                    <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <button
                            type="button"
                            onClick={() => setActiveTab('elements')}
                            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === 'elements' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Elements
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('targets')}
                            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === 'targets' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Drop Targets
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('tokens')}
                            className={`py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                activeTab === 'tokens' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Token Bank
                        </button>
                    </div>

                    {/* Tab 1: Elements Inspector */}
                    {activeTab === 'elements' && (
                        <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 flex items-center justify-between">
                                <span>Canvas Element Properties</span>
                                {selectedElement && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteElement(selectedElement.id)}
                                        className="text-rose-500 hover:text-rose-600 text-[10px] font-bold flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" /> Hapus
                                    </button>
                                )}
                            </h4>

                            {selectedElement ? (
                                <div className="space-y-3">
                                    {selectedElement.type === 'text' ? (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase">Isi Teks:</label>
                                                <textarea
                                                    rows={3}
                                                    value={selectedElement.text}
                                                    onChange={(e) => handleUpdateElement(selectedElement.id, { text: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Font Size:</label>
                                                    <input
                                                        type="number"
                                                        value={selectedElement.fontSize || 18}
                                                        onChange={(e) => handleUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Style:</label>
                                                    <select
                                                        value={selectedElement.fontStyle || 'normal'}
                                                        onChange={(e) => handleUpdateElement(selectedElement.id, { fontStyle: e.target.value })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="bold">Bold</option>
                                                        <option value="italic">Italic</option>
                                                        <option value="bold italic">Bold Italic</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                                                <span className="text-[10px] font-black uppercase text-emerald-700">🖼️ Image Element</span>
                                                <p className="text-[10px] text-emerald-600">
                                                    Tarik titik sudut (kotak transformer) di kanvas atau ubah ukuran pixel di bawah:
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Lebar (Width px):</label>
                                                    <input
                                                        type="number"
                                                        value={selectedElement.width || 120}
                                                        onChange={(e) => handleUpdateElement(selectedElement.id, { width: parseInt(e.target.value) || 20 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tinggi (Height px):</label>
                                                    <input
                                                        type="number"
                                                        value={selectedElement.height || 100}
                                                        onChange={(e) => handleUpdateElement(selectedElement.id, { height: parseInt(e.target.value) || 20 })}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                                    />
                                                </div>
                                            </div>

                                            {/* Quick Size Presets */}
                                            <div>
                                                <label className="text-[9px] font-bold text-slate-500 uppercase">Ukuran Cepat:</label>
                                                <div className="flex gap-1.5 mt-1">
                                                    {[
                                                        { label: 'Kecil', w: 80, h: 60 },
                                                        { label: 'Sedang', w: 140, h: 100 },
                                                        { label: 'Besar', w: 220, h: 160 },
                                                        { label: 'Jumbo', w: 320, h: 220 }
                                                    ].map((preset) => (
                                                        <button
                                                            key={preset.label}
                                                            type="button"
                                                            onClick={() => handleUpdateElement(selectedElement.id, { width: preset.w, height: preset.h })}
                                                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                                    Klik salah satu teks atau gambar di kanvas untuk mengedit properties.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Targets Inspector (Drop Zones) */}
                    {activeTab === 'targets' && (
                        <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                    Daftar Sasaran Drop ({canvasState.targets.length})
                                </h4>
                            </div>

                            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                                {canvasState.targets.map((tgt, idx) => (
                                    <div
                                        key={tgt.id}
                                        onClick={() => setSelectedTargetId(tgt.id)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                            selectedTargetId === tgt.id
                                                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-black uppercase text-amber-700 flex items-center gap-1.5">
                                                {tgt.type === 'ring_target' ? '🟢 Ring Spot' : tgt.type === 'box_target' ? '☑️ Box Centang/Silang' : tgt.type === 'input_target' ? '⌨️ Kotak Isian (Ketik)' : '🔤 Word Spot'} #{idx + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTarget(tgt.id);
                                                }}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="space-y-1.5">
                                            <input
                                                type="text"
                                                value={tgt.label}
                                                onChange={(e) => handleUpdateTarget(tgt.id, { label: e.target.value })}
                                                placeholder="Label Sasaran (misal: Nomor 1)"
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] font-bold p-1.5 rounded-lg focus:border-amber-400"
                                            />

                                            {tgt.type === 'input_target' && (
                                                <div className="space-y-1.5">
                                                    <div>
                                                        <label className="text-[9px] font-black uppercase text-sky-700">Kunci Jawaban Teks (Case Insensitive):</label>
                                                        <input
                                                            type="text"
                                                            value={tgt.correct_text || ''}
                                                            onChange={(e) => handleUpdateTarget(tgt.id, { correct_text: e.target.value })}
                                                            placeholder="Contoh: trousers / dress"
                                                            className="w-full bg-sky-50 border border-sky-300 text-sky-900 text-[11px] font-black p-1.5 rounded-lg focus:bg-white focus:border-sky-500"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-500 uppercase">Lebar (px):</label>
                                                            <input
                                                                type="number"
                                                                value={tgt.width || 120}
                                                                onChange={(e) => handleUpdateTarget(tgt.id, { width: parseInt(e.target.value) || 80 })}
                                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-bold text-slate-500 uppercase">Tinggi (px):</label>
                                                            <input
                                                                type="number"
                                                                value={tgt.height || 36}
                                                                onChange={(e) => handleUpdateTarget(tgt.id, { height: parseInt(e.target.value) || 30 })}
                                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {tgt.type === 'box_target' && (
                                                <select
                                                    value={tgt.correct_symbol || (tgt.correct_token_id?.includes('chk') ? 'check' : 'cross') || 'check'}
                                                    onChange={(e) => handleUpdateTarget(tgt.id, { correct_symbol: e.target.value, correct_token_id: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 text-emerald-700 text-[11px] font-black p-1.5 rounded-lg focus:border-emerald-400"
                                                >
                                                    <option value="check">✔ True (Centang Hijau Benar)</option>
                                                    <option value="cross">✖ False (Silang Merah Benar)</option>
                                                </select>
                                            )}

                                            {tgt.type === 'word_target' && (
                                                <select
                                                    value={tgt.correct_token_id || ''}
                                                    onChange={(e) => handleUpdateTarget(tgt.id, { correct_token_id: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 text-amber-700 text-[11px] font-bold p-1.5 rounded-lg focus:border-amber-400"
                                                >
                                                    <option value="">-- Kunci Jawaban Kata --</option>
                                                    {canvasState.tokens.filter(t => t.type === 'word').map(w => (
                                                        <option key={w.id} value={w.id}>
                                                            Kata: {w.text}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Tokens Bank Manager */}
                    {activeTab === 'tokens' && (
                        <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                                    Token Yang Diberikan ke Siswa
                                </h4>
                            </div>

                            {/* Preset Buttons for Quick Tokens */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddCheckToken}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
                                >
                                    <span>✔</span> + Centang
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddCrossToken}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
                                >
                                    <span>✖</span> + Silang
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddRingToken}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
                                >
                                    <span>🟢</span> + Ring
                                </button>
                            </div>

                            {/* Add Word Input */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <input
                                    type="text"
                                    value={newWordInput}
                                    onChange={(e) => setNewWordInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddWordToken(e)}
                                    placeholder="+ Kata (misal: cake)..."
                                    className="bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs font-bold px-3 py-2 rounded-xl flex-1 focus:bg-white focus:border-amber-400"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddWordToken}
                                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-sm"
                                >
                                    Tambah
                                </button>
                            </div>

                            {/* Token List */}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {canvasState.tokens.map((tok) => (
                                    <div
                                        key={tok.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-xs ${
                                            tok.type === 'check'
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                : tok.type === 'cross'
                                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                                : tok.type === 'ring'
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                : 'bg-orange-50 border-orange-300 text-orange-800'
                                        }`}
                                    >
                                        <span>{tok.symbol ? `${tok.symbol} ` : ''}{tok.text || tok.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteToken(tok.id)}
                                            className="opacity-50 hover:opacity-100 hover:text-red-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
