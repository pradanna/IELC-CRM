import React, { useState, useRef, useEffect } from "react";
import {
    Type,
    Image as ImageIcon,
    Undo2,
    Redo2,
    ChevronDown,
    Sparkles,
} from "lucide-react";

export default function CanvasToolbar({
    historyStep,
    historyLength,
    onUndo,
    onRedo,
    onAddText,
    onAddImage,
    onAddTarget,
    onAddRingToken,
    onAddCheckToken,
}) {
    const [isExampleMenuOpen, setIsExampleMenuOpen] = useState(false);
    const exampleDropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                exampleDropdownRef.current &&
                !exampleDropdownRef.current.contains(event.target)
            ) {
                setIsExampleMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                        Kids Free-Form Canvas Studio
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Rancang soal secara bebas di atas kanvas: tambah teks,
                        gambar, sasaran kotak centang/silang, lingkaran, dan
                        kata.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Undo / Redo Buttons */}
                <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 shadow-sm mr-1">
                    <button
                        type="button"
                        onClick={onUndo}
                        disabled={historyStep <= 0}
                        title="Undo (Ctrl+Z)"
                        className={`p-1.5 rounded-lg transition-colors ${
                            historyStep > 0
                                ? "text-slate-700 hover:bg-slate-100 cursor-pointer"
                                : "text-slate-300 cursor-not-allowed"
                        }`}
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={onRedo}
                        disabled={historyStep >= historyLength - 1}
                        title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
                        className={`p-1.5 rounded-lg transition-colors ${
                            historyStep < historyLength - 1
                                ? "text-slate-700 hover:bg-slate-100 cursor-pointer"
                                : "text-slate-300 cursor-not-allowed"
                        }`}
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Add Text */}
                <button
                    type="button"
                    onClick={onAddText}
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
                        onChange={onAddImage}
                        className="hidden"
                    />
                </label>

                {/* Add Checkbox Target Box */}
                <button
                    type="button"
                    onClick={() => onAddTarget("box_target")}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm"
                >
                    <span className="w-3.5 h-3.5 border-2 border-emerald-600 rounded-sm inline-flex items-center justify-center text-[9px] font-black text-emerald-600">
                        ✓
                    </span>
                    <span>+ Centang/Silang</span>
                </button>

                {/* Add Text Input Box (Ketik Jawaban) */}
                <button
                    type="button"
                    onClick={() => onAddTarget("input_target")}
                    className="px-3.5 py-2 bg-white hover:bg-sky-50 text-sky-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-sky-300 transition-all shadow-sm"
                >
                    <span className="w-3.5 h-3 border border-sky-600 rounded-xs inline-flex items-center justify-center text-[8px] font-black text-sky-600 bg-sky-50">
                        |
                    </span>
                    <span>+ Kotak Ketik (Isian)</span>
                </button>

                {/* Add Ring Target Spot */}
                <button
                    type="button"
                    onClick={() => onAddTarget("ring_target")}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm"
                    title="Tambah lingkaran target di kanvas"
                >
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 inline-block" />
                    <span>+ Ring</span>
                </button>

                {/* Add Word Target Spot */}
                <button
                    type="button"
                    onClick={() => onAddTarget("word_target")}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all shadow-sm"
                >
                    <span className="w-3.5 h-2 border-b-2 border-amber-500 inline-block" />
                    <span>+ Kata</span>
                </button>

                {/* Divider */}
                <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

                {/* Dropdown Example (Semua Contoh Terjawab / Active) */}
                <div className="relative" ref={exampleDropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsExampleMenuOpen((prev) => !prev)}
                        className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ring-2 ring-violet-400/30"
                        title="Daftar Template Contoh Soal (Sudah Terjawab / Aktif)"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>+ Contoh Soal (Terjawab)</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExampleMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu Items */}
                    {isExampleMenuOpen && (
                        <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-violet-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                            <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                                <p className="text-[10px] font-black uppercase text-violet-700 tracking-wider">
                                    Contoh Soal (Tidak Masuk Nilai)
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                                    Bentuk contoh sudah dalam keadaan aktif / terjawab untuk membimbing siswa.
                                </p>
                            </div>

                            {/* 1. Contoh Ring Hijau (Terjawab) */}
                            <button
                                type="button"
                                onClick={() => {
                                    onAddTarget("example_ring");
                                    setIsExampleMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-violet-50/80 rounded-xl transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center shrink-0">
                                    <span className="text-emerald-700 text-[9px] font-black">⭕</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-violet-700">
                                        Contoh Ring (Lingkaran)
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        Lingkaran hijau aktif melingkari jawaban
                                    </p>
                                </div>
                            </button>

                            {/* 2. Contoh Spot Kata (Terjawab) */}
                            <button
                                type="button"
                                onClick={() => {
                                    onAddTarget("example_word");
                                    setIsExampleMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-violet-50/80 rounded-xl transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-xl border-2 border-orange-400 bg-orange-50 flex items-center justify-center shrink-0">
                                    <span className="text-orange-600 text-xs font-black">🔤</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-violet-700">
                                        Contoh Spot Kata (Word)
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        Slot kata oranye terisi teks jawaban aktif
                                    </p>
                                </div>
                            </button>

                            {/* 3. Contoh Centang (✔ True) */}
                            <button
                                type="button"
                                onClick={() => {
                                    onAddTarget("example_box_check");
                                    setIsExampleMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-violet-50/80 rounded-xl transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-xl border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center shrink-0">
                                    <span className="text-emerald-600 text-sm font-black">✔</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-violet-700">
                                        Contoh Kotak Centang (✔)
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        Kotak terisi centang hijau (True)
                                    </p>
                                </div>
                            </button>

                            {/* 4. Contoh Silang (✖ False) */}
                            <button
                                type="button"
                                onClick={() => {
                                    onAddTarget("example_box_cross");
                                    setIsExampleMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-violet-50/80 rounded-xl transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-xl border-2 border-rose-500 bg-rose-50 flex items-center justify-center shrink-0">
                                    <span className="text-rose-600 text-sm font-black">✖</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-violet-700">
                                        Contoh Kotak Silang (✖)
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        Kotak terisi silang merah (False)
                                    </p>
                                </div>
                            </button>

                            {/* 5. Contoh Kotak Isian (Ketik) */}
                            <button
                                type="button"
                                onClick={() => {
                                    onAddTarget("example_input");
                                    setIsExampleMenuOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-violet-50/80 rounded-xl transition-colors flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-xl border-2 border-sky-500 bg-sky-50 flex items-center justify-center shrink-0">
                                    <span className="text-sky-600 text-xs font-black">⌨</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 group-hover:text-violet-700">
                                        Contoh Kotak Isian (Ketik)
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        Isian teks biru sudah terisi jawaban contoh
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <span className="w-px h-6 bg-slate-200 mx-1 shrink-0" />

                {/* Direct Token Add Buttons */}
                <button
                    type="button"
                    onClick={onAddRingToken}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1.5 border border-emerald-300 transition-all shadow-sm"
                    title="Buat Token Ring (Tarik ke Jawaban Benar) di kanvas untuk ditarik siswa"
                >
                    <span className="text-sm">⭕</span>
                    <span>+ Tarik ke Jawaban Benar</span>
                </button>

                <button
                    type="button"
                    onClick={onAddCheckToken}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1 border border-emerald-300 transition-all shadow-sm"
                    title="Buat Token Centang di kanvas"
                >
                    <span className="text-emerald-600 font-bold">✔</span>
                    <span>+ Token Centang</span>
                </button>
            </div>
        </div>
    );
}
