import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, StickyNote, User, Clock, MessageSquare, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function LeadNotesTab({ lead, onRefresh }) {
    const [newNote, setNewNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!lead?.lead_notes);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const notes = lead?.lead_notes || [];

    // Handle loading state transitions
    useEffect(() => {
        if (lead?.lead_notes) {
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }
    }, [lead?.id, lead?.lead_notes]);

    // Auto-scroll to bottom when new notes arrive
    useEffect(() => {
        if (scrollRef.current && !isLoading) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [notes.length, isLoading]);

    const handleSave = async () => {
        if (!lead || saving || !newNote.trim()) return;

        setSaving(true);
        setError(null);

        try {
            await axios.post(route('admin.crm.leads.store-note', lead.id), {
                content: newNote
            });
            setNewNote('');
            if (onRefresh) {
                onRefresh(true);
            }
        } catch (err) {
            console.error('Error saving note:', err);
            setError(err.response?.data?.errors?.content?.[0] || err.response?.data?.message || 'Gagal menyimpan catatan. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                    <AlertCircle className="text-red-500 shrink-0" size={18} />
                    <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{error}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <StickyNote className="text-red-600" size={20} />
                        </div>
                        Lead Discussion & Notes
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        Internal collaboration and history for this lead.
                    </p>
                </div>
            </div>

            {/* Notes List Container */}
            <div className="flex-1 min-h-0 flex flex-col space-y-4">
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
                >
                    {isLoading ? (
                        /* Skeleton Loading */
                        [1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border-2 border-slate-50 rounded-3xl p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-100" />
                                    <div className="space-y-2">
                                        <div className="h-2 w-24 bg-slate-100 rounded" />
                                        <div className="h-2 w-16 bg-slate-50 rounded" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-full bg-slate-50 rounded" />
                                    <div className="h-3 w-3/4 bg-slate-50 rounded" />
                                </div>
                            </div>
                        ))
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-slate-300">
                            <MessageSquare size={48} strokeWidth={1} className="mb-4 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest opacity-40">No notes yet</p>
                        </div>
                    ) : (
                        notes.map((note, index) => (
                            <div 
                                key={note.id || index}
                                className="group relative bg-white border-2 border-slate-50 rounded-3xl p-6 transition-all hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 animate-in fade-in slide-in-from-right-4 duration-500"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                {note.user?.name || 'Unknown User'}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                <Clock size={10} />
                                                {note.human_at}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {note.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* New Note Input */}
                <div className="relative group mt-auto pt-4">
                    <div className="absolute -inset-2 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                    <div className="relative bg-white border-2 border-slate-100 rounded-3xl shadow-sm focus-within:border-red-500/30 transition-all overflow-hidden">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a new internal note or update..."
                            className="w-full h-32 p-6 text-sm font-medium text-slate-700 placeholder:text-slate-300 placeholder:italic outline-none resize-none bg-transparent"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    handleSave();
                                }
                            }}
                        />
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shadow-sm">Ctrl + Enter</kbd> to save
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={saving || !newNote.trim()}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all
                                    ${newNote.trim() 
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700 active:scale-95' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin" size={14} />
                                ) : (
                                    <Send size={14} />
                                )}
                                <span>Add Note</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
