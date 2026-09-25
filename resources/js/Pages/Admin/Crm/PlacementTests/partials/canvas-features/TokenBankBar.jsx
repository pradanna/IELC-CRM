import React from "react";

export default function TokenBankBar({ tokens = [] }) {
    return (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                    <span>🎒</span> Bank Token Siswa ({tokens.length} Token Aktif)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                    (Item yang akan ditarik siswa saat ujian)
                </span>
            </div>

            {tokens.length === 0 ? (
                <div className="py-2.5 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs font-medium">
                    Belum ada token. Klik tombol <b>[+ Centang]</b>,{" "}
                    <b>[+ Silang]</b>, atau tambah kata di tab{" "}
                    <b>Token Bank</b> di sebelah kanan.
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {tokens.map((tok) => (
                        <div
                            key={tok.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-xs shadow-xs select-none ${
                                tok.type === "check"
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                    : tok.type === "cross"
                                      ? "bg-rose-50 border-rose-300 text-rose-700"
                                      : tok.type === "ring"
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                        : tok.type === "image"
                                          ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                                          : "bg-orange-50 border-orange-300 text-orange-800"
                            }`}
                        >
                            {tok.type === "image" ? (
                                <div className="flex items-center gap-1.5">
                                    <img
                                        src={tok.src}
                                        alt={tok.label || "Token"}
                                        className="w-5 h-5 object-contain rounded-md bg-white border border-indigo-200"
                                    />
                                    <span>{tok.label || "Gambar"}</span>
                                </div>
                            ) : (
                                <span>
                                    {tok.text
                                        ? `${tok.symbol ? `${tok.symbol} ` : ""}${tok.text}`
                                        : (tok.label || tok.symbol || tok.type)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
