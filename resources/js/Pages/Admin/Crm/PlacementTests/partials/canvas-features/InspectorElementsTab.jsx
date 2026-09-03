import React from "react";
import {
    Trash2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    BringToFront,
    SendToBack,
    ChevronUp,
    ChevronDown,
    Layers,
} from "lucide-react";

export default function InspectorElementsTab({
    elements,
    selectedElement,
    selectedId,
    selectedIds = [],
    onSelectElement,
    onUpdateElement,
    onDeleteElement,
    onMoveElementLayer,
}) {
    return (
        <div className="space-y-4">
            {/* 1. Selected Element Properties */}
            {selectedElement ? (
                <div className="space-y-4 bg-white p-4 rounded-2xl border border-amber-300 shadow-md ring-2 ring-amber-400/20">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-amber-700">
                            <span>{selectedElement.type === "text" ? "📝" : "🖼️"}</span>
                            <span>
                                Edit {selectedElement.type === "text" ? "Teks" : "Gambar"} Aktif
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={() => onDeleteElement(selectedElement.id)}
                            className="text-rose-500 hover:text-rose-600 text-[10px] font-bold flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                    </h4>

                    <div className="space-y-3">
                        {selectedElement.type === "text" ? (
                            <>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                                        Isi Teks:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={selectedElement.text}
                                        onChange={(e) =>
                                            onUpdateElement(selectedElement.id, {
                                                text: e.target.value,
                                            })
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                                            Font Size:
                                        </label>
                                        <input
                                            type="number"
                                            value={selectedElement.fontSize || 18}
                                            onChange={(e) =>
                                                onUpdateElement(selectedElement.id, {
                                                    fontSize:
                                                        parseInt(e.target.value) || 16,
                                                })
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                                            Style:
                                        </label>
                                        <select
                                            value={selectedElement.fontStyle || "normal"}
                                            onChange={(e) =>
                                                onUpdateElement(selectedElement.id, {
                                                    fontStyle: e.target.value,
                                                })
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                            <option value="italic">Italic</option>
                                            <option value="bold italic">Bold Italic</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Text Alignment */}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                                        Rata Teks (Alignment):
                                    </label>
                                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateElement(selectedElement.id, {
                                                    align: "left",
                                                })
                                            }
                                            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                                (selectedElement.align || "left") === "left"
                                                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                            title="Rata Kiri"
                                        >
                                            <AlignLeft className="w-3.5 h-3.5" />
                                            <span>Kiri</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateElement(selectedElement.id, {
                                                    align: "center",
                                                })
                                            }
                                            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                                selectedElement.align === "center"
                                                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                            title="Rata Tengah"
                                        >
                                            <AlignCenter className="w-3.5 h-3.5" />
                                            <span>Tengah</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onUpdateElement(selectedElement.id, {
                                                    align: "right",
                                                })
                                            }
                                            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                                selectedElement.align === "right"
                                                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                            title="Rata Kanan"
                                        >
                                            <AlignRight className="w-3.5 h-3.5" />
                                            <span>Kanan</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                                    <span className="text-[10px] font-black uppercase text-emerald-700">
                                        🖼️ Image Element
                                    </span>
                                    <p className="text-[10px] text-emerald-600">
                                        Tarik titik sudut (kotak transformer) di kanvas atau ubah ukuran pixel di bawah:
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                                            Lebar (Width px):
                                        </label>
                                        <input
                                            type="number"
                                            value={selectedElement.width || 120}
                                            onChange={(e) =>
                                                onUpdateElement(selectedElement.id, {
                                                    width: parseInt(e.target.value) || 20,
                                                })
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                                            Tinggi (Height px):
                                        </label>
                                        <input
                                            type="number"
                                            value={selectedElement.height || 100}
                                            onChange={(e) =>
                                                onUpdateElement(selectedElement.id, {
                                                    height: parseInt(e.target.value) || 20,
                                                })
                                            }
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-bold mt-1 focus:bg-white focus:border-amber-400"
                                        />
                                    </div>
                                </div>

                                {/* Quick Size Presets */}
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">
                                        Ukuran Cepat:
                                    </label>
                                    <div className="flex gap-1.5 mt-1">
                                        {[
                                            { label: "Kecil", w: 80, h: 60 },
                                            { label: "Sedang", w: 140, h: 100 },
                                            { label: "Besar", w: 220, h: 160 },
                                            { label: "Jumbo", w: 320, h: 220 },
                                        ].map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() =>
                                                    onUpdateElement(selectedElement.id, {
                                                        width: preset.w,
                                                        height: preset.h,
                                                    })
                                                }
                                                className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Layer Ordering Controls */}
                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-600 uppercase flex items-center justify-between">
                                <span>Urutan Layer Objek Ini</span>
                                <span className="text-[9px] font-bold text-slate-400">Ctrl+[ / Ctrl+]</span>
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => onMoveElementLayer(selectedElement.id, "front")}
                                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    title="Pindahkan ke paling atas / paling depan (Ctrl+Shift+])"
                                >
                                    <BringToFront className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Paling Depan</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onMoveElementLayer(selectedElement.id, "forward")}
                                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    title="Maju 1 tingkat ke atas (Ctrl+])"
                                >
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Maju 1 Step</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onMoveElementLayer(selectedElement.id, "backward")}
                                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    title="Mundur 1 tingkat ke bawah (Ctrl+[)"
                                >
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Mundur 1 Step</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onMoveElementLayer(selectedElement.id, "back")}
                                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                    title="Pindahkan ke paling bawah / background (Ctrl+Shift+[)"
                                >
                                    <SendToBack className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Paling Belakang</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-center text-amber-800 text-xs font-bold">
                    Pilih salah satu elemen di daftar bawah atau klik di kanvas untuk mengedit properties.
                </div>
            )}

            {/* 2. Full Elements List / Layer Tree */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>Daftar Layer Elements ({elements.length})</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">Urutan: Atas = Paling Depan</span>
                </div>

                {elements.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs font-medium">
                        Belum ada teks atau gambar di kanvas.
                    </div>
                ) : (
                    <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                        {[...elements].reverse().map((el) => {
                            const isSelected =
                                (selectedIds && selectedIds.includes(el.id)) ||
                                selectedId === el.id;
                            return (
                                <div
                                    key={el.id}
                                    onClick={(e) => onSelectElement(el.id, e)}
                                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                        isSelected
                                            ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs"
                                            : "bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-xs shrink-0">
                                            {el.type === "text" ? "📝" : "🖼️"}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-800 truncate">
                                                {el.type === "text"
                                                    ? el.text || "(Teks Kosong)"
                                                    : `Gambar (${el.width || 120}x${el.height || 100}px)`}
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-medium">
                                                Posisi: X:{el.x}, Y:{el.y}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Layer Controls on each element */}
                                    <div
                                        className="flex items-center gap-0.5 shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onMoveElementLayer(el.id, "front")}
                                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-white rounded transition-colors"
                                            title="Ke Paling Depan"
                                        >
                                            <BringToFront className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onMoveElementLayer(el.id, "forward")}
                                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-white rounded transition-colors"
                                            title="Maju 1 Step"
                                        >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onMoveElementLayer(el.id, "backward")}
                                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-white rounded transition-colors"
                                            title="Mundur 1 Step"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onMoveElementLayer(el.id, "back")}
                                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-white rounded transition-colors"
                                            title="Ke Paling Belakang (Background)"
                                        >
                                            <SendToBack className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteElement(el.id)}
                                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-white rounded transition-colors ml-1"
                                            title="Hapus Elemen"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
