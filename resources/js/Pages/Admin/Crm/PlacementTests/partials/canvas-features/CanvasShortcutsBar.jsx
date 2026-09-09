import React from "react";
import { MousePointer } from "lucide-react";

export default function CanvasShortcutsBar({ stageWidth, stageHeight }) {
    return (
        <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-slate-700">
                    <MousePointer className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                        <b>Ctrl+Z</b> Undo
                    </span>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Ctrl+Y</b> Redo
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Ctrl+A</b> Pilih Semua
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Ctrl+D</b> Duplikat
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Ctrl+V</b> Tempel Gambar
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>P</b> Center (Tengah)
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Shift + Klik</b> Multi-Pilih
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Shift + Drag</b> Lurus (Vertikal/Horizontal)
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Ctrl+[/]</b> Layer Belakang/Depan
                </span>
                <span className="text-slate-300">•</span>
                <span>
                    <b>Del</b> Hapus
                </span>
            </span>
            <span className="shrink-0 text-slate-400 font-mono">
                {stageWidth} x {stageHeight} px
            </span>
        </div>
    );
}
