import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, 
    Trash2, 
    Palette, 
    Image as ImageIcon, 
    CheckCircle2, 
    Move, 
    MousePointerClick, 
    X,
    Maximize2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Layers,
    Type
} from 'lucide-react';
import TextInput from '@/Components/form/TextInput';
import InputLabel from '@/Components/form/InputLabel';
import FileInput from '@/Components/form/FileInput';

export default function KidsImageCanvasBuilder({ value, onChange, onMediaChange, existingMediaUrl }) {
    // Canvas Data Structure:
    // {
    //    mode: 'image_pin_gap_fill',
    //    image_preview: string (url or local data),
    //    word_bank: [ { id: 'w_1', text: 'fine' }, { id: 'w_2', text: 'your' }, ... ],
    //    drop_zones: [
    //       { id: 'dz_1', number: 1, x_percent: 28.5, y_percent: 35.2, correct_word_id: 'w_1', label: '1' }
    //    ]
    // }
    const [canvasData, setCanvasData] = useState(() => {
        if (!value) {
            return {
                mode: 'image_pin_gap_fill',
                image_preview: existingMediaUrl || '',
                word_bank: [
                    { id: 'w_1', text: 'fine' },
                    { id: 'w_2', text: 'your' },
                    { id: 'w_3', text: "name's" },
                    { id: 'w_4', text: 'How' },
                    { id: 'w_5', text: 'ten' }
                ],
                drop_zones: []
            };
        }
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return {
            mode: 'image_pin_gap_fill',
            image_preview: parsed.image_preview || existingMediaUrl || '',
            word_bank: parsed.word_bank || [],
            drop_zones: parsed.drop_zones || []
        };
    });

    const [newWordInput, setNewWordInput] = useState('');
    const [selectedPinId, setSelectedPinId] = useState(null);
    const imageContainerRef = useRef(null);

    // Sync state up to form
    useEffect(() => {
        onChange(canvasData);
    }, [canvasData]);

    // Handle local image file upload
    const handleImageUpload = (file) => {
        if (!file) return;
        if (onMediaChange) onMediaChange(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setCanvasData(prev => ({
                ...prev,
                image_preview: e.target.result
            }));
        };
        reader.readAsDataURL(file);
    };

    // Click on image to drop a new pin zone
    const handleImageClick = (e) => {
        if (!imageContainerRef.current || !canvasData.image_preview) return;
        
        const rect = imageContainerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const xPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
        const yPercent = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

        const nextNumber = canvasData.drop_zones.length + 1;
        const newPinId = `dz_${Date.now()}`;
        const defaultWordId = canvasData.word_bank[0]?.id || '';

        const newPin = {
            id: newPinId,
            number: nextNumber,
            x_percent: parseFloat(xPercent.toFixed(2)),
            y_percent: parseFloat(yPercent.toFixed(2)),
            correct_word_id: defaultWordId,
            label: `${nextNumber}`
        };

        setCanvasData(prev => ({
            ...prev,
            drop_zones: [...prev.drop_zones, newPin]
        }));
        setSelectedPinId(newPinId);
    };

    // Remove a Drop Pin
    const handleRemovePin = (pinId) => {
        setCanvasData(prev => {
            const filtered = prev.drop_zones.filter(p => p.id !== pinId);
            // Renumber pins
            const renumbered = filtered.map((pin, idx) => ({
                ...pin,
                number: idx + 1,
                label: `${idx + 1}`
            }));
            return {
                ...prev,
                drop_zones: renumbered
            };
        });
        if (selectedPinId === pinId) setSelectedPinId(null);
    };

    // Update Drop Pin Correct Answer
    const handleUpdatePinWord = (pinId, wordId) => {
        setCanvasData(prev => ({
            ...prev,
            drop_zones: prev.drop_zones.map(pin => 
                pin.id === pinId ? { ...pin, correct_word_id: wordId } : pin
            )
        }));
    };

    // Add Word to Word Bank
    const handleAddWord = (e) => {
        e?.preventDefault();
        const text = newWordInput.trim();
        if (!text) return;

        const newId = `w_${Date.now()}`;
        setCanvasData(prev => ({
            ...prev,
            word_bank: [...prev.word_bank, { id: newId, text }]
        }));
        setNewWordInput('');
    };

    // Remove Word from Word Bank
    const handleRemoveWord = (wordId) => {
        setCanvasData(prev => ({
            ...prev,
            word_bank: prev.word_bank.filter(w => w.id !== wordId),
            drop_zones: prev.drop_zones.map(pin => 
                pin.correct_word_id === wordId ? { ...pin, correct_word_id: '' } : pin
            )
        }));
    };

    return (
        <div className="space-y-6 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-2xl">
            {/* Header / Instructions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
                        <Palette className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                            Interactive Image Canvas Builder (Kids)
                        </h3>
                        <p className="text-xs text-slate-400">
                            Upload gambar percakapan/komik, tentukan pilihan kata, lalu klik gambar untuk menaruh kotak drop zone jawaban.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {canvasData.drop_zones.length} Pins Placed
                    </span>
                </div>
            </div>

            {/* Step 1: Upload Worksheet Image */}
            <div className="space-y-2">
                <InputLabel value="1. Upload Gambar Worksheet / Komik Percakapan" className="!text-slate-300 text-xs font-black uppercase" />
                <FileInput
                    accept="image/*"
                    onChange={handleImageUpload}
                    placeholder="Pilih file gambar worksheet (PNG, JPG, WebP)..."
                    icon={ImageIcon}
                    className="!bg-slate-800/80 !border-slate-700 !text-white"
                />
            </div>

            {/* Step 2: Word Bank Management */}
            <div className="space-y-3 p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80">
                <div className="flex items-center justify-between">
                    <InputLabel value="2. Pilihan Kata (Word Bank Cards)" className="!text-slate-300 text-xs font-black uppercase" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {canvasData.word_bank.length} Words Available
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {canvasData.word_bank.map((word) => (
                        <div 
                            key={word.id} 
                            className="group flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-xl font-black text-xs shadow-sm transition-all hover:bg-amber-500/25"
                        >
                            <span>{word.text}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveWord(word.id)}
                                className="text-amber-400/50 hover:text-red-400 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}

                    {/* Quick Add Word Input */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newWordInput}
                            onChange={(e) => setNewWordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWord(e)}
                            placeholder="+ Tambah kata..."
                            className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs font-bold px-3 py-1.5 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all w-36"
                        />
                        <button
                            type="button"
                            onClick={handleAddWord}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 3: Interactive Visual Canvas Area */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <InputLabel value="3. Klik Area Gambar untuk Menaruh Kotak Jawaban (Drop Pin)" className="!text-slate-300 text-xs font-black uppercase" />
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold">
                            <MousePointerClick className="w-3 h-3" /> Click-to-Pin Mode Active
                        </span>
                    </div>

                    {canvasData.drop_zones.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setCanvasData(prev => ({ ...prev, drop_zones: [] }))}
                            className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-widest flex items-center gap-1"
                        >
                            <RotateCcw className="w-3 h-3" /> Reset Semua Pin
                        </button>
                    )}
                </div>

                {/* Canvas Box */}
                {canvasData.image_preview ? (
                    <div className="relative bg-slate-950 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-inner flex items-center justify-center p-2 group">
                        <div 
                            ref={imageContainerRef}
                            onClick={handleImageClick}
                            className="relative cursor-crosshair inline-block select-none max-w-full"
                        >
                            <img 
                                src={canvasData.image_preview} 
                                alt="Worksheet preview" 
                                className="w-full max-h-[550px] object-contain rounded-xl block pointer-events-none"
                            />

                            {/* Render Interactive Pin Overlay Boxes */}
                            {canvasData.drop_zones.map((pin) => {
                                const isSelected = selectedPinId === pin.id;
                                const assignedWord = canvasData.word_bank.find(w => w.id === pin.correct_word_id);

                                return (
                                    <div
                                        key={pin.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPinId(pin.id);
                                        }}
                                        style={{
                                            left: `${pin.x_percent}%`,
                                            top: `${pin.y_percent}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                        className={`absolute z-20 min-w-[70px] min-h-[34px] px-2 py-1 rounded-xl border-2 transition-all flex flex-col items-center justify-center shadow-lg backdrop-blur-xs cursor-pointer ${
                                            isSelected
                                                ? 'border-amber-400 bg-amber-500/80 text-slate-950 ring-4 ring-amber-400/30 scale-110 z-30'
                                                : 'border-sky-400 bg-sky-900/80 text-white hover:border-amber-300 hover:scale-105'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span className="w-4 h-4 rounded-full bg-slate-950/40 text-[9px] font-black flex items-center justify-center">
                                                {pin.number}
                                            </span>
                                            <span className="text-[10px] font-black tracking-tight truncate max-w-[80px]">
                                                {assignedWord ? assignedWord.text : '(Pilih Kunci)'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="py-16 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-950/40">
                        <ImageIcon className="w-12 h-12 text-slate-600 mb-3" />
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            Belum Ada Gambar Worksheet
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            Silakan upload file gambar worksheet terlebih dahulu di Step 1 di atas untuk mulai meletakkan pin kotak jawaban.
                        </p>
                    </div>
                )}
            </div>

            {/* Step 4: Pin Answer Configuration List */}
            {canvasData.drop_zones.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                    <InputLabel value="4. Hubungkan Kunci Jawaban Kata untuk Setiap Nomor Pin" className="!text-slate-300 text-xs font-black uppercase" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {canvasData.drop_zones.map((pin) => (
                            <div 
                                key={pin.id}
                                onClick={() => setSelectedPinId(pin.id)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                    selectedPinId === pin.id
                                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/20'
                                        : 'bg-slate-800/70 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                                        #{pin.number}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePin(pin.id);
                                        }}
                                        className="text-slate-400 hover:text-red-400 p-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                        Kunci Jawaban Kata:
                                    </label>
                                    <select
                                        value={pin.correct_word_id}
                                        onChange={(e) => handleUpdatePinWord(pin.id, e.target.value)}
                                        className="w-full text-xs font-bold py-1.5 px-2.5 rounded-xl border-slate-600 bg-slate-900 text-white focus:border-amber-400 focus:ring-amber-400"
                                    >
                                        <option value="">-- Pilih Kata Kunci --</option>
                                        {canvasData.word_bank.map(w => (
                                            <option key={w.id} value={w.id}>
                                                {w.text}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
