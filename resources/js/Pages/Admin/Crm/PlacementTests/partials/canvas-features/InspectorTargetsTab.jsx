import React from "react";
import {
    Trash2,
    BringToFront,
    SendToBack,
    ChevronUp,
    ChevronDown,
} from "lucide-react";

export default function InspectorTargetsTab({
    targets,
    tokens,
    selectedTargetId,
    selectedTargetIds = [],
    onSelectTarget,
    onUpdateTarget,
    onDeleteTarget,
    onMoveTargetLayer,
}) {
    return (
        <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Daftar Sasaran Drop ({targets.length})
                </h4>
            </div>

            <div className="space-y-2 max-h-[850px] overflow-y-auto pr-1">
                {targets.map((tgt, idx) => {
                    const isSelected =
                        (selectedTargetIds &&
                            selectedTargetIds.includes(tgt.id)) ||
                        selectedTargetId === tgt.id;
                    return (
                        <div
                            key={tgt.id}
                            onClick={(e) => onSelectTarget(tgt.id, e)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                isSelected
                                    ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/20"
                                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                            }`}
                        >
                        <div className="flex items-center justify-between mb-2">
                            <span
                                className="text-[11px] font-black uppercase flex items-center gap-1.5"
                                style={{
                                    color: tgt.is_example
                                        ? "#7c3aed"
                                        : "#b45309",
                                }}
                            >
                                {tgt.type === "ring_target"
                                    ? "🟢 Target Jawaban Benar"
                                    : tgt.type === "box_target"
                                      ? "☑️ Box Centang/Silang"
                                      : tgt.type === "input_target"
                                        ? "⌨️ Kotak Isian (Ketik)"
                                        : tgt.type === "example_circle"
                                          ? "⭕ Contoh Lingkaran/Ring (Terjawab)"
                                          : tgt.type === "example_box"
                                            ? "☑️ Contoh Box Centang/Silang (Terjawab)"
                                            : tgt.type === "example_word"
                                              ? "🔤 Contoh Word / Kata (Terjawab)"
                                              : tgt.type === "example_input"
                                                ? "⌨️ Contoh Kotak Isian (Terjawab)"
                                                : "🔤 Word Spot"}{" "}
                                #{idx + 1}
                            </span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTarget(tgt.id);
                                }}
                                className="text-slate-400 hover:text-red-500 p-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            {/* Badge: example (not scored) */}
                            {tgt.is_example && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-xl">
                                    <span className="text-[10px] font-black uppercase text-violet-700">
                                        ⚠️ Contoh Soal
                                    </span>
                                    <span className="text-[10px] text-violet-500 font-medium">
                                        — Tidak dihitung di score
                                    </span>
                                </div>
                            )}

                            <input
                                type="text"
                                value={tgt.label || ""}
                                onChange={(e) =>
                                    onUpdateTarget(tgt.id, {
                                        label: e.target.value,
                                    })
                                }
                                placeholder={
                                    tgt.is_example
                                        ? "Label contoh (misal: Contoh 1)"
                                        : "Label Sasaran (misal: Nomor 1)"
                                }
                                className={`w-full bg-white border text-slate-800 text-[11px] font-bold p-1.5 rounded-lg focus:outline-none ${
                                    tgt.is_example
                                        ? "border-violet-200 focus:border-violet-400"
                                        : "border-slate-200 focus:border-amber-400"
                                }`}
                            />

                            {tgt.type === "input_target" && (
                                <div className="space-y-1.5">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-sky-700">
                                            Kunci Jawaban Teks (Case Insensitive):
                                        </label>
                                        <input
                                            type="text"
                                            value={tgt.correct_text || ""}
                                            onChange={(e) =>
                                                onUpdateTarget(tgt.id, {
                                                    correct_text: e.target.value,
                                                })
                                            }
                                            placeholder="Contoh: trousers / dress"
                                            className="w-full bg-sky-50 border border-sky-300 text-sky-900 text-[11px] font-black p-1.5 rounded-lg focus:bg-white focus:border-sky-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Font (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.fontSize || 11}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        fontSize:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 11,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Lebar (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.width || 120}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        width:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 80,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Tinggi (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.height || 36}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        height:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 30,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tgt.type === "box_target" && (
                                <select
                                    value={
                                        tgt.correct_symbol ||
                                        (tgt.correct_token_id?.includes("chk")
                                            ? "check"
                                            : "cross") ||
                                        "check"
                                    }
                                    onChange={(e) =>
                                        onUpdateTarget(tgt.id, {
                                            correct_symbol: e.target.value,
                                            correct_token_id: e.target.value,
                                        })
                                    }
                                    className="w-full bg-white border border-slate-200 text-emerald-700 text-[11px] font-black p-1.5 rounded-lg focus:border-emerald-400"
                                >
                                    <option value="check">
                                        ✔ True (Centang Hijau Benar)
                                    </option>
                                    <option value="cross">
                                        ✖ False (Silang Merah Benar)
                                    </option>
                                </select>
                            )}

                            {tgt.type === "ring_target" && (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Radius (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.radius || 24}
                                                min={12}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        radius:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 24,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Font Size (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.fontSize || 16}
                                                min={10}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        fontSize:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 16,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Kunci Jawaban Benar / Pengecoh */}
                                    <div className="pt-1.5 border-t border-slate-200/70">
                                        <label className="flex items-center gap-2 cursor-pointer p-1.5 bg-white rounded-lg border border-slate-200 hover:border-emerald-300">
                                            <input
                                                type="checkbox"
                                                checked={tgt.is_correct_answer !== false}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        is_correct_answer: e.target.checked,
                                                    })
                                                }
                                                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
                                            />
                                            <div className="flex-1">
                                                <span className={`text-[10px] font-black uppercase ${tgt.is_correct_answer !== false ? "text-emerald-700" : "text-slate-500"}`}>
                                                    {tgt.is_correct_answer !== false ? "✔ Target Jawaban Benar" : "✖ Target Pengecoh (Distractor)"}
                                                </span>
                                                <p className="text-[9px] text-slate-400 font-medium">
                                                    {tgt.is_correct_answer !== false
                                                        ? "Siswa mendapat nilai jika melingkari target ini"
                                                        : "Pilihan salah, tidak dihitung benar jika dilingkari"}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {tgt.type === "example_circle" && (
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                        <label className="text-[9px] font-bold text-violet-600 uppercase">
                                            Radius (px):
                                        </label>
                                        <input
                                            type="number"
                                            value={tgt.radius || 28}
                                            min={12}
                                            onChange={(e) =>
                                                onUpdateTarget(tgt.id, {
                                                    radius:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 28,
                                                })
                                            }
                                            className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-violet-600 uppercase">
                                            Ukuran Teks (px):
                                        </label>
                                        <input
                                            type="number"
                                            value={tgt.fontSize || 14}
                                            min={10}
                                            onChange={(e) =>
                                                onUpdateTarget(tgt.id, {
                                                    fontSize:
                                                        parseInt(
                                                            e.target.value
                                                        ) || 14,
                                                })
                                            }
                                            className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                        />
                                    </div>
                                </div>
                            )}

                            {tgt.type === "example_box" && (
                                <div className="space-y-1.5">
                                    <div>
                                        <label className="text-[9px] font-bold text-violet-600 uppercase">
                                            Simbol Contoh Terjawab:
                                        </label>
                                        <select
                                            value={tgt.example_symbol || "check"}
                                            onChange={(e) =>
                                                onUpdateTarget(tgt.id, {
                                                    example_symbol: e.target.value,
                                                })
                                            }
                                            className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[11px] font-black p-1.5 rounded-lg"
                                        >
                                            <option value="check">✔ Centang Hijau (Terjawab Benar)</option>
                                            <option value="cross">✖ Silang Merah (Terjawab Salah)</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-violet-600 uppercase">
                                                Lebar (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.width || 36}
                                                min={20}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        width:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 36,
                                                    })
                                                }
                                                className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-violet-600 uppercase">
                                                Tinggi (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.height || 36}
                                                min={20}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        height:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 36,
                                                    })
                                                }
                                                className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tgt.type === "example_word" && (
                                <div className="space-y-1.5">
                                    <div>
                                        <label className="text-[9px] font-bold text-violet-600 uppercase">
                                            Teks Kata Contoh (Terjawab Aktif):
                                        </label>
                                        <input
                                            type="text"
                                            value={tgt.example_text || ""}
                                            onChange={(e) =>
                                                onUpdateTarget(tgt.id, {
                                                    example_text: e.target.value,
                                                })
                                            }
                                            placeholder="Contoh: apple, cat, dll"
                                            className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[11px] font-black p-1.5 rounded-lg"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-violet-600 uppercase">
                                                Lebar (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.width || 100}
                                                min={30}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        width:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 100,
                                                    })
                                                }
                                                className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-violet-600 uppercase">
                                                Tinggi (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.height || 32}
                                                min={20}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        height:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 32,
                                                    })
                                                }
                                                className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tgt.type === "example_input" && (
                                <div className="space-y-1.5">
                                    <div>
                                        <label className="text-[9px] font-bold text-violet-600 uppercase">
                                            Teks Isian Contoh (Terjawab Aktif):
                                        </label>
                                        <input
                                            type="text"
                                            value={tgt.example_text || ""}
                                            onChange={(e) =>
                                                onUpdateTarget(tgt.id, {
                                                    example_text: e.target.value,
                                                })
                                            }
                                            placeholder="Contoh isian terisi..."
                                            className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[11px] font-black p-1.5 rounded-lg"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-violet-600 uppercase">
                                                Lebar (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.width || 120}
                                                min={40}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        width:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 120,
                                                    })
                                                }
                                                className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-violet-600 uppercase">
                                                Tinggi (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.height || 36}
                                                min={20}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        height:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 36,
                                                    })
                                                }
                                                className="w-full bg-violet-50 border border-violet-200 text-violet-900 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tgt.type === "word_target" && (
                                <div className="space-y-1.5">
                                    <select
                                        value={tgt.correct_token_id || ""}
                                        onChange={(e) =>
                                            onUpdateTarget(tgt.id, {
                                                correct_token_id:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full bg-white border border-slate-200 text-amber-700 text-[11px] font-bold p-1.5 rounded-lg focus:border-amber-400"
                                    >
                                        <option value="">
                                            -- Kunci Jawaban Kata --
                                        </option>
                                        {tokens
                                            .filter((t) => t.type === "word")
                                            .map((w) => (
                                                <option key={w.id} value={w.id}>
                                                    Kata: {w.text}
                                                </option>
                                            ))}
                                    </select>

                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Font (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.fontSize || 10}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        fontSize:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 10,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Lebar (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.width || 100}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        width:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 60,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase">
                                                Tinggi (px):
                                            </label>
                                            <input
                                                type="number"
                                                value={tgt.height || 30}
                                                onChange={(e) =>
                                                    onUpdateTarget(tgt.id, {
                                                        height:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 20,
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-[10px] font-bold p-1 rounded-md"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Target Layer Ordering Controls */}
                            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">
                                    Layer:
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveTargetLayer(tgt.id, "front");
                                        }}
                                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 hover:text-amber-600 transition-colors"
                                        title="Paling Depan"
                                    >
                                        <BringToFront className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveTargetLayer(
                                                tgt.id,
                                                "forward"
                                            );
                                        }}
                                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 hover:text-amber-600 transition-colors"
                                        title="Maju 1 Tingkat"
                                    >
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveTargetLayer(
                                                tgt.id,
                                                "backward"
                                            );
                                        }}
                                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 hover:text-amber-600 transition-colors"
                                        title="Mundur 1 Tingkat"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMoveTargetLayer(tgt.id, "back");
                                        }}
                                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 hover:text-amber-600 transition-colors"
                                        title="Paling Belakang"
                                    >
                                        <SendToBack className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
