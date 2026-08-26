import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, Sparkles, Image as ImageIcon, CheckCircle2, Move, AlertCircle } from 'lucide-react';
import TextInput from '@/Components/form/TextInput';
import InputLabel from '@/Components/form/InputLabel';

export default function KidsCanvasBuilder({ value, onChange }) {
    // Structure of canvasData:
    // {
    //    mode: 'categorize', // 'categorize' | 'match_image' | 'word_order'
    //    zones: [ { id: 'zone_1', label: 'Land Animals', color: 'emerald' }, { id: 'zone_2', label: 'Sea Animals', color: 'blue' } ],
    //    items: [ { id: 'item_1', text: 'Lion', image: '', target_zone: 'zone_1' } ]
    // }
    const [canvasData, setCanvasData] = useState(() => {
        if (!value) {
            return {
                mode: 'categorize',
                instruction_note: 'Tarik setiap gambar/kata ke kotak kelompok yang benar!',
                zones: [
                    { id: 'zone_1', label: 'Group A (e.g. Animals)', color: 'amber' },
                    { id: 'zone_2', label: 'Group B (e.g. Fruits)', color: 'emerald' }
                ],
                items: [
                    { id: 'item_1', text: 'Cat 🐱', image: '', target_zone: 'zone_1' },
                    { id: 'item_2', text: 'Apple 🍎', image: '', target_zone: 'zone_2' }
                ]
            };
        }
        return typeof value === 'string' ? JSON.parse(value) : value;
    });

    useEffect(() => {
        onChange(canvasData);
    }, [canvasData]);

    const handleAddZone = () => {
        const newId = `zone_${Date.now()}`;
        const colors = ['amber', 'emerald', 'sky', 'indigo', 'rose', 'purple'];
        const randomColor = colors[canvasData.zones.length % colors.length];
        setCanvasData(prev => ({
            ...prev,
            zones: [...prev.zones, { id: newId, label: `Kategori #${prev.zones.length + 1}`, color: randomColor }]
        }));
    };

    const handleRemoveZone = (zoneId) => {
        if (canvasData.zones.length <= 1) return;
        setCanvasData(prev => ({
            ...prev,
            zones: prev.zones.filter(z => z.id !== zoneId),
            items: prev.items.map(it => it.target_zone === zoneId ? { ...it, target_zone: '' } : it)
        }));
    };

    const handleUpdateZone = (zoneId, label, color) => {
        setCanvasData(prev => ({
            ...prev,
            zones: prev.zones.map(z => z.id === zoneId ? { ...z, label, color: color || z.color } : z)
        }));
    };

    const handleAddItem = () => {
        const newId = `item_${Date.now()}`;
        const defaultZone = canvasData.zones[0]?.id || '';
        setCanvasData(prev => ({
            ...prev,
            items: [...prev.items, { id: newId, text: '', image: '', target_zone: defaultZone }]
        }));
    };

    const handleRemoveItem = (itemId) => {
        setCanvasData(prev => ({
            ...prev,
            items: prev.items.filter(it => it.id !== itemId)
        }));
    };

    const handleUpdateItem = (itemId, field, val) => {
        setCanvasData(prev => ({
            ...prev,
            items: prev.items.map(it => it.id === itemId ? { ...it, [field]: val } : it)
        }));
    };

    return (
        <div className="space-y-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                        <Sparkles className="w-5 h-5" />
                    </span>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                            Kids Interactive Drag & Drop Builder
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Atur kotak wadah target (Drop Zones) dan kartu item yang akan ditarik oleh anak.
                        </p>
                    </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-500/20">
                    Auto-Grading Ready
                </span>
            </div>

            {/* Step 1: Drop Zones / Categories */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <InputLabel value="1. Kotak Target / Kategori Drop Zones" className="text-xs font-black uppercase" />
                    <button
                        type="button"
                        onClick={handleAddZone}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-black rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kotak / Zona</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {canvasData.zones.map((zone, idx) => (
                        <div key={zone.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase text-slate-400">
                                    Zona #{idx + 1}
                                </span>
                                {canvasData.zones.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveZone(zone.id)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <TextInput
                                value={zone.label}
                                onChange={(e) => handleUpdateZone(zone.id, e.target.value)}
                                placeholder="Nama Wadah / Kategori (misal: Land Animals)"
                                className="!py-1.5 !text-xs font-bold w-full"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 2: Draggable Items */}
            <div className="space-y-3 pt-3 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                    <InputLabel value="2. Kartu Item yang Bisa Di-drag" className="text-xs font-black uppercase" />
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black rounded-lg shadow-2xs flex items-center gap-1 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Kartu Item</span>
                    </button>
                </div>

                <div className="space-y-2.5">
                    {canvasData.items.map((item, idx) => (
                        <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center font-mono text-[10px] font-black text-slate-500 shrink-0">
                                    #{idx + 1}
                                </span>
                                <TextInput
                                    value={item.text}
                                    onChange={(e) => handleUpdateItem(item.id, 'text', e.target.value)}
                                    placeholder="Label Teks / Emoji (misal: Elephant 🐘)"
                                    className="!py-1.5 !text-xs font-bold flex-1"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-2 min-w-[220px]">
                                <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                                    Target Benar:
                                </span>
                                <select
                                    value={item.target_zone}
                                    onChange={(e) => handleUpdateItem(item.id, 'target_zone', e.target.value)}
                                    className="text-xs font-bold py-1.5 px-2.5 rounded-lg border-slate-200 focus:border-amber-500 focus:ring-amber-500 bg-slate-50 flex-1"
                                    required
                                >
                                    {canvasData.zones.map(z => (
                                        <option key={z.id} value={z.id}>{z.label || 'Tanpa Nama'}</option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
