import React from "react";
import { Trash2 } from "lucide-react";

export default function InspectorTokensTab({
    tokens,
    targets = [],
    newWordInput,
    onChangeNewWordInput,
    onAddWordToken,
    onAddCheckToken,
    onAddCrossToken,
    onAddRingToken,
    onUpdateToken,
    onDeleteToken,
}) {
    return (
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
                    onClick={onAddCheckToken}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
                >
                    <span>✔</span> + Centang
                </button>
                <button
                    type="button"
                    onClick={onAddCrossToken}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
                >
                    <span>✖</span> + Silang
                </button>
                <button
                    type="button"
                    onClick={onAddRingToken}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
                >
                    <span>🟢</span> + Tarik ke Jawaban Benar
                </button>
            </div>

            {/* Add Word Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                    type="text"
                    value={newWordInput}
                    onChange={(e) => onChangeNewWordInput(e.target.value)}
                    onKeyDown={(e) =>
                        e.key === "Enter" && onAddWordToken(e)
                    }
                    placeholder="+ Kata (misal: cake)..."
                    className="bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs font-bold px-3 py-2 rounded-xl flex-1 focus:bg-white focus:border-amber-400"
                />
                <button
                    type="button"
                    onClick={onAddWordToken}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-sm"
                >
                    Tambah
                </button>
            </div>

            {/* Token List */}
            <div className="space-y-2.5 pt-2 max-h-[850px] overflow-y-auto pr-1">
                {tokens.map((tok) => {
                    const isRing = tok.type === "ring";
                    const ringTargets = (targets || []).filter(
                        (t) => t.type === "ring_target"
                    );
                    const allowedIds = Array.isArray(tok.allowed_target_ids)
                        ? tok.allowed_target_ids
                        : tok.allowed_target_id
                        ? [tok.allowed_target_id]
                        : [];

                    return (
                        <div
                            key={tok.id}
                            className={`p-3 rounded-2xl border space-y-2 ${
                                tok.type === "check"
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                    : tok.type === "cross"
                                      ? "bg-rose-50/70 border-rose-200 text-rose-900"
                                      : tok.type === "ring"
                                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                        : "bg-orange-50/70 border-orange-200 text-orange-950"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="font-black text-xs shrink-0">
                                        {tok.symbol ? `${tok.symbol} ` : ""}
                                    </span>
                                    {tok.type === "word" ? (
                                        <input
                                            type="text"
                                            value={tok.text || ""}
                                            onChange={(e) =>
                                                onUpdateToken(tok.id, {
                                                    text: e.target.value,
                                                })
                                            }
                                            className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-2 py-1 rounded-lg flex-1 min-w-[80px]"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold truncate">
                                            {tok.label || (tok.type === "ring" ? "🟢 Token Ring (Polos)" : tok.text || tok.type)}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1 py-0.5 text-[9px] font-bold text-slate-500">
                                        <span>X:</span>
                                        <input
                                            type="number"
                                            value={typeof tok.x === "number" ? tok.x : 850}
                                            onChange={(e) =>
                                                onUpdateToken(tok.id, {
                                                    x: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="w-10 text-slate-800 text-center font-bold outline-none"
                                            title="Posisi X di kanvas"
                                        />
                                        <span>Y:</span>
                                        <input
                                            type="number"
                                            value={typeof tok.y === "number" ? tok.y : 150}
                                            onChange={(e) =>
                                                onUpdateToken(tok.id, {
                                                    y: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="w-10 text-slate-800 text-center font-bold outline-none"
                                            title="Posisi Y di kanvas"
                                        />
                                    </div>
                                    {tok.type === "word" && (
                                        <>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Font:
                                            </label>
                                            <input
                                                type="number"
                                                value={tok.fontSize || 18}
                                                onChange={(e) =>
                                                    onUpdateToken(tok.id, {
                                                        fontSize:
                                                            parseInt(e.target.value) || 12,
                                                    })
                                                }
                                                className="w-12 bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md text-center"
                                                title="Ukuran font token kata (px)"
                                            />
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onDeleteToken(tok.id)}
                                        className="text-slate-400 hover:text-red-600 p-1 ml-1"
                                        title="Hapus Token"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Ring Token Specific: Pembatasan Target Drop (Bisa Multiple / Bebas) */}
                            {isRing && (
                                <div className="pt-2 border-t border-emerald-200/70 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[9px] font-black uppercase text-emerald-800 flex items-center gap-1">
                                            <span>🎯 Target Khusus</span>
                                            <span className="text-[9px] font-medium text-emerald-600">
                                                ({allowedIds.length === 0
                                                    ? "Bebas / Semua Ring"
                                                    : `${allowedIds.length} Ring Dipilih`})
                                            </span>
                                        </label>
                                        {allowedIds.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onUpdateToken(tok.id, {
                                                        allowed_target_id: "",
                                                        allowed_target_ids: [],
                                                    });
                                                }}
                                                className="text-[9px] font-bold text-slate-500 hover:text-emerald-700 underline"
                                            >
                                                Reset ke Bebas
                                            </button>
                                        )}
                                    </div>

                                    {ringTargets.length > 0 ? (
                                        <div className="space-y-1 bg-white border border-emerald-300 rounded-xl p-2 shadow-2xs">
                                            {/* Option Bebas / Semua */}
                                            <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-emerald-50/80 cursor-pointer transition-colors border border-dashed border-emerald-200">
                                                <input
                                                    type="checkbox"
                                                    checked={allowedIds.length === 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            onUpdateToken(tok.id, {
                                                                allowed_target_id: "",
                                                                allowed_target_ids: [],
                                                            });
                                                        }
                                                    }}
                                                    className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-[10px] font-black text-emerald-900 block leading-tight">
                                                        🌐 Bebas / Flexible (Bisa di-drop ke semua Ring)
                                                    </span>
                                                    <span className="text-[9px] text-emerald-600 block leading-tight">
                                                        Siswa bebas menaruh ring ini di ring spot mana saja
                                                    </span>
                                                </div>
                                            </label>

                                            <div className="pt-1 border-t border-slate-100 space-y-1 max-h-40 overflow-y-auto pr-0.5">
                                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-1">
                                                    Atau pilih 1, 2, 3 atau lebih Target Jawaban Benar yang diizinkan:
                                                </p>
                                                {ringTargets.map((rt, idx) => {
                                                    const isChecked = allowedIds.includes(rt.id);
                                                    return (
                                                        <label
                                                            key={rt.id}
                                                            className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                                                                isChecked
                                                                    ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold"
                                                                    : "hover:bg-slate-50 text-slate-700 border border-transparent"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    let newIds;
                                                                    if (e.target.checked) {
                                                                        newIds = [...allowedIds, rt.id];
                                                                    } else {
                                                                        newIds = allowedIds.filter((id) => id !== rt.id);
                                                                    }
                                                                    onUpdateToken(tok.id, {
                                                                        allowed_target_ids: newIds,
                                                                        allowed_target_id: newIds.length === 1 ? newIds[0] : "",
                                                                    });
                                                                }}
                                                                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 shrink-0"
                                                            />
                                                            <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 inline-block shrink-0" />
                                                            <span className="text-[10px] truncate flex-1">
                                                                Jawaban Benar #{idx + 1}: <b>"{rt.label || 'Tanpa Label'}"</b>
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[10px] text-emerald-800 space-y-1">
                                            <p className="font-bold flex items-center gap-1">
                                                <span>ℹ️</span> Belum ada Target Jawaban Benar di kanvas.
                                            </p>
                                            <p className="text-emerald-700 leading-tight">
                                                Tambahkan <b>+ Jawaban Benar</b> di toolbar atas terlebih dahulu, kemudian kembali ke tab ini untuk mencentang target yang diizinkan (bisa pilih 2, 3, atau 5 jawaban benar).
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
