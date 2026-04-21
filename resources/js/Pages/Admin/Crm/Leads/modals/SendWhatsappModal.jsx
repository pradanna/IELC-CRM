import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MessageSquare, Phone, Save, Link as LinkIcon, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import useWhatsapp from '@/Hooks/useWhatsapp';

/**
 * Send Whatsapp Modal
 * Dedicated modal for composing and sending WhatsApp messages with templates & media library.
 */
export default function SendWhatsappModal({ 
    isOpen, 
    onClose, 
    lead, 
    chatTemplates = [], 
    mediaAssets = [] 
}) {
    const { openWhatsapp } = useWhatsapp();
    const [message, setMessage] = useState('');
    const [copyFeedback, setCopyFeedback] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Initial message from selection or default
    useEffect(() => {
        if (isOpen) {
            setMessage('');
            setCopyFeedback(null);
            setSearchQuery('');
        }
    }, [isOpen]);

    const filteredTemplates = useMemo(() => {
        if (!lead) return [];
        return chatTemplates.filter(template => {
            const hasPhases = template.lead_phases?.length > 0;
            const hasTypes = template.lead_types?.length > 0;

            if (!hasPhases && !hasTypes) return true; // Global

            const phaseMatch = hasPhases && template.lead_phases.some(p => p.id === lead.lead_phase_id);
            const typeMatch = hasTypes && template.lead_types.some(t => t.id === lead.lead_type_id);

            return phaseMatch || typeMatch;
        });
    }, [chatTemplates, lead, isOpen]);

    const filteredMedia = useMemo(() => {
        let results = mediaAssets;
        if (debouncedSearch) {
            results = results.filter(asset => 
                asset.name.toLowerCase().includes(debouncedSearch.toLowerCase())
            );
        }
        return results.slice(0, 5); // Max 5 results as requested
    }, [mediaAssets, debouncedSearch]);

    const handleSend = () => {
        if (!lead?.phone) return;
        openWhatsapp(lead.phone, message);
        onClose();
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(id);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const isImage = (mime) => mime?.startsWith('image/');
    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024, dm = 2, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
                            
                            {/* LEFT: FORM SECTION */}
                            <div className="flex-1 flex flex-col border-r border-slate-100 h-full overflow-hidden">
                                {/* Header */}
                                <div className="px-8 pt-8 pb-4 border-b border-slate-50 bg-white z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-lg font-black text-slate-900">
                                                Send WhatsApp Message
                                            </Dialog.Title>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                Messaging: {lead?.name} ({lead?.phone})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    {/* Templates */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            Available Templates 
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">{filteredTemplates.length}</span>
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {filteredTemplates.length === 0 ? (
                                                <p className="text-xs font-bold text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-dashed w-full text-center">No specific templates for this lead.</p>
                                            ) : (
                                                filteredTemplates.map(template => (
                                                    <button
                                                        key={template.id}
                                                        onClick={() => setMessage(template.message)}
                                                        className="px-5 py-2.5 bg-white border border-slate-200 hover:border-green-500 hover:text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-green-100 active:scale-95"
                                                    >
                                                        {template.title}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Area */}
                                    <div className="flex-1 flex flex-col pt-2 min-h-0">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Message Content (Format WA Native)</label>
                                        <textarea
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Halo kak, berikut informasi..."
                                            className="w-full flex-1 min-h-[300px] px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-green-500/5 focus:border-green-500 transition-all resize-none shadow-inner"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="px-8 py-6 flex gap-3 border-t border-slate-50 bg-slate-50/20">
                                    <button
                                        type="button" onClick={onClose}
                                        className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={!message}
                                        className="flex-[2] py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                                    >
                                        <Phone size={14} /> Send to WhatsApp
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT: MEDIA ASSETS LIBRARY */}
                            <div className="w-full md:w-80 lg:w-96 bg-slate-50 flex flex-col h-full">
                                <div className="px-6 pt-8 pb-4 border-b border-slate-200 sticky top-0 bg-slate-50 z-10 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900">Media Assets Library</h3>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                Copy link to insert into message
                                            </p>
                                        </div>
                                        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    
                                    {/* Small Search Bar with Debounce */}
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Search brosur..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm pl-9"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            {debouncedSearch !== searchQuery ? <Loader2 size={14} className="animate-spin" /> : <LinkIcon size={14} />}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {filteredMedia.length === 0 ? (
                                        <div className="py-20 text-center">
                                            <ImageIcon size={32} className="mx-auto text-slate-200 mb-4" />
                                            <p className="text-xs font-bold text-slate-400">No media assets found.</p>
                                        </div>
                                    ) : (
                                        filteredMedia.map(asset => {
                                            const fileUrl = `${window.location.origin}/storage/${asset.file_path}`;
                                            return (
                                                <div key={asset.id} className="bg-white border text-left border-slate-200 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-green-200 hover:shadow-md group">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                                                            {isImage(asset.mime_type) ? (
                                                                <ImageIcon size={20} className="text-green-500" />
                                                            ) : (
                                                                <File size={20} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight" title={asset.name}>{asset.name}</h4>
                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                                {formatBytes(asset.size)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(fileUrl, asset.id)}
                                                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-slate-100 group-hover:border-green-100"
                                                    >
                                                        {copyFeedback === asset.id ? (
                                                            <span className="text-emerald-500 italic">Link Copied!</span>
                                                        ) : (
                                                            <>
                                                                <LinkIcon size={12} /> Copy URL Link
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="p-6 bg-slate-100/50 border-t border-slate-200">
                                    <div className="p-4 bg-white rounded-2xl border border-slate-200 text-[10px] font-bold text-slate-500 italic leading-relaxed">
                                        Tip: Salin link media di sini, lalu tempel (Paste) di editor pesan sebelah kiri sebelum dikirim.
                                    </div>
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
