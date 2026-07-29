import React, { useState } from 'react';
import { X, FileCode, Send, Sparkles } from 'lucide-react';

export default function TemplateSelectorModal({
    isOpen,
    onClose,
    templates,
    loading,
    onSendTemplate,
}) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [variables, setVariables] = useState({});

    if (!isOpen) return null;

    const handleSelectTemplate = (tpl) => {
        setSelectedTemplate(tpl);
        const initialVars = {};
        tpl.variables.forEach((v, idx) => {
            initialVars[`var_${idx + 1}`] = '';
        });
        setVariables(initialVars);
    };

    const handleVariableChange = (key, val) => {
        setVariables((prev) => ({ ...prev, [key]: val }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedTemplate) return;
        onSendTemplate(selectedTemplate, variables);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                            <FileCode size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900">Official Meta WhatsApp Templates</h3>
                            <p className="text-[11px] text-slate-400">Pilih template yang disetujui Meta</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {loading ? (
                        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                            <p>Memuat list template...</p>
                        </div>
                    ) : !selectedTemplate ? (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Template:</label>
                            <div className="grid grid-cols-1 gap-3">
                                {templates.map((tpl) => (
                                    <div
                                        key={tpl.id}
                                        onClick={() => handleSelectTemplate(tpl)}
                                        className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 cursor-pointer transition-all space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs font-black text-blue-700">{tpl.name}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                                                {tpl.category}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium">{tpl.header}</p>
                                        <p className="text-xs text-slate-400 line-clamp-2">{tpl.body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <button
                                type="button"
                                onClick={() => setSelectedTemplate(null)}
                                className="text-xs text-blue-600 hover:underline font-bold"
                            >
                                ← Kembali ke daftar template
                            </button>

                            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                                <span className="font-mono text-xs font-black text-blue-800">{selectedTemplate.name}</span>
                                <p className="text-xs text-slate-700 leading-relaxed">{selectedTemplate.body}</p>
                            </div>

                            {/* Dynamic Variables Input */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Isi Variable Template:</label>
                                {selectedTemplate.variables.map((vLabel, idx) => {
                                    const key = `var_${idx + 1}`;
                                    return (
                                        <div key={key} className="space-y-1">
                                            <label className="text-[11px] font-semibold text-slate-500">
                                                {`{{${idx + 1}}}`} — {vLabel}:
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={variables[key] || ''}
                                                onChange={(e) => handleVariableChange(key, e.target.value)}
                                                placeholder={`Masukkan ${vLabel}...`}
                                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
                                >
                                    <Send size={13} />
                                    Kirim Template WA Official
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
