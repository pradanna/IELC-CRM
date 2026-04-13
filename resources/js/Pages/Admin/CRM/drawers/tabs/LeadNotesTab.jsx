import React, { useState, useEffect } from 'react';
import { Save, Loader2, StickyNote, CheckCircle2 } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function LeadNotesTab({ lead, onRefresh }) {
    const [notes, setNotes] = useState(lead?.notes || '');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (lead) {
            setNotes(lead.notes || '');
            setHasChanges(false);
        }
    }, [lead?.id, lead?.notes]);

    const handleNotesChange = (e) => {
        setNotes(e.target.value);
        setHasChanges(e.target.value !== (lead?.notes || ''));
    };

    const handleSave = () => {
        if (!lead || saving) return;

        setSaving(true);
        router.patch(route('admin.crm.leads.update-notes', lead.id), {
            notes: notes
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setLastSaved(new Date());
                setHasChanges(false);
                if (onRefresh) onRefresh();
            },
            onError: (errors) => {
                console.error('Error saving notes:', errors);
                alert('Gagal menyimpan catatan. Silakan coba lagi.');
            },
            onFinish: () => {
                setSaving(false);
            }
        });
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Info */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                        <StickyNote className="text-red-500" size={20} />
                        Global Lead Notes
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        Use this space for important internal information about the lead.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {lastSaved && !hasChanges && (
                        <div className="flex items-center gap-1.5 text-emerald-500 animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
                        </div>
                    )}
                    
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all
                            ${hasChanges 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                        `}
                    >
                        {saving ? (
                            <Loader2 className="animate-spin" size={14} />
                        ) : (
                            <Save size={14} />
                        )}
                        <span>Save Notes</span>
                    </button>
                </div>
            </div>

            {/* Note Area */}
            <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-red-500/5 rounded-3xl blur-2xl group-focus-within:bg-red-500/10 transition-all duration-500" />
                <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Tuliskan catatan khusus di sini... (Contoh: Preferensi jadwal, riwayat diskusi penting, atau catatan khusus dari tim cabang)"
                    className="relative w-full h-[450px] bg-white border-2 border-slate-100 rounded-3xl p-8 text-sm font-medium text-slate-700 focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 transition-all outline-none resize-none shadow-sm placeholder:text-slate-300 placeholder:italic leading-relaxed"
                />
                
                {hasChanges && (
                    <div className="absolute bottom-6 right-8 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                        Unsaved changes
                    </div>
                )}
            </div>

            {/* Formatting Tips */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-3">Workspace Tips</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-slate-300 rounded-full mt-1.5" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                            Catatan ini bersifat global dan dapat dilihat oleh staf admin lain yang memiliki akses ke lead ini.
                        </p>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-slate-300 rounded-full mt-1.5" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">
                            Pastikan untuk mengklik tombol "Save" setelah selesai melakukan perubahan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
