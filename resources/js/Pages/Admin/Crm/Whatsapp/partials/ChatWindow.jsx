import React, { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Send, FileCode, CheckCheck, Check, ShieldCheck, PhoneCall, User, UserPlus, AlertCircle } from 'lucide-react';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';

export default function ChatWindow({
    selectedContact,
    messages,
    loadingMessages,
    inputMessage,
    setInputMessage,
    onSendMessage,
    activeTab,
    onOpenTemplateModal,
    sending,
}) {
    const messagesEndRef = useRef(null);
    const { openDrawer } = useLeadDrawer();

    const handleCreateLead = (phone) => {
        const clean = (phone || '').replace(/[^0-9]/g, '');
        router.visit(route('admin.crm.leads.list', { create_lead: 1, phone: clean }));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loadingMessages]);

    if (!selectedContact) {
        return (
            <div className="flex-1 bg-slate-50/70 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-300 mb-4">
                    {activeTab === 'official' ? <ShieldCheck size={38} className="text-blue-500/40" /> : <PhoneCall size={38} className="text-emerald-500/40" />}
                </div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    WhatsApp Web Live Inbox
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Pilih percakapan di sebelah kiri untuk melihat pesan masuk, riwayat chat, dan membalas langsung ke nomor kontak.
                </p>
            </div>
        );
    }

    const isNonLead = selectedContact.name === 'No Name' || !selectedContact.is_lead;

    return (
        <div className="flex-1 bg-[#efeae2]/40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] flex flex-col h-full overflow-hidden">
            {/* Top Chat Header */}
            <div className="px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${
                        activeTab === 'official'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                        {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`text-sm ${isNonLead ? 'font-bold text-slate-700 italic' : 'font-black text-slate-900'}`}>
                                {selectedContact.name || 'No Name'}
                            </h3>
                            {isNonLead ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300">
                                    Belum Jadi Lead
                                </span>
                            ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    activeTab === 'official' 
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}>
                                    {activeTab === 'official' ? 'Official Meta' : 'Perangkat Cabang'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-emerald-700 font-mono font-bold mt-0.5">{selectedContact.phone}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* If Non-Lead / No Name: Show Buat Lead button */}
                    {isNonLead ? (
                        <button
                            type="button"
                            onClick={() => handleCreateLead(selectedContact.phone)}
                            className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer"
                            title="Daftarkan nomor WhatsApp ini sebagai Lead baru"
                        >
                            <UserPlus size={14} />
                            <span>+ Buat Lead Baru</span>
                        </button>
                    ) : (
                        selectedContact.crm_id && (
                            <button
                                type="button"
                                onClick={() => openDrawer(selectedContact.crm_id, 0)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm bg-slate-100 hover:bg-slate-200 text-slate-700"
                                title="Buka Profil CRM"
                            >
                                <User size={13} />
                                <span>Profil Lead CRM</span>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Quick Action Banner for Non-Leads */}
            {isNonLead && (
                <div className="bg-amber-50/95 border-b border-amber-200/80 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 shadow-xs flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-amber-200/70 text-amber-800">
                            <AlertCircle size={14} />
                        </span>
                        <span>
                            Nomor WhatsApp <strong className="font-mono text-emerald-800 font-bold">{selectedContact.phone}</strong> belum terdaftar sebagai Lead CRM.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleCreateLead(selectedContact.phone)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                        <UserPlus size={12} />
                        <span>Daftarkan Jadi Lead</span>
                    </button>
                </div>
            )}

            {/* Message History Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 custom-scrollbar">
                {loadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
                        <span className="text-xs text-slate-400">Memuat riwayat chat...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 bg-white/60 backdrop-blur-sm rounded-2xl max-w-sm mx-auto p-4 border border-slate-200/50">
                        Belum ada riwayat pesan. Kirim pesan di bawah untuk memulai obrolan.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                                    isAdmin
                                        ? activeTab === 'official'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-emerald-200/60'
                                        : 'bg-white text-[#111b21] border border-slate-200/80 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.template_name && (
                                        <div className={`mb-1 pb-1 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 ${
                                            isAdmin && activeTab === 'official' ? 'border-b border-white/20 text-white/90' : 'border-b border-slate-200 text-slate-500'
                                        }`}>
                                            <FileCode size={11} /> Template: {msg.template_name}
                                        </div>
                                    )}
                                    {msg.media_url && (
                                        <div className="mb-2">
                                            {msg.media_url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                                <img 
                                                    src={msg.media_url} 
                                                    alt="Media" 
                                                    className="rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                                                    onClick={() => window.open(msg.media_url, '_blank')} 
                                                />
                                            ) : (
                                                <a 
                                                    href={msg.media_url} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="inline-flex items-center gap-1.5 underline font-medium text-emerald-700 hover:text-emerald-800"
                                                >
                                                    Lihat Lampiran
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                        isAdmin 
                                            ? activeTab === 'official' ? 'text-white/80' : 'text-slate-500'
                                            : 'text-slate-400'
                                    }`}>
                                        <span>{msg.timestamp}</span>
                                        {isAdmin && (
                                            msg.status === 'read' ? <CheckCheck size={13} className={activeTab === 'official' ? "text-sky-300" : "text-[#53bdeb]"} /> : <Check size={13} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 bg-white border-t border-slate-200/80 flex-shrink-0 shadow-lg">
                {activeTab === 'official' && (
                    <div className="mb-2 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onOpenTemplateModal}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <FileCode size={13} />
                            Gunakan Meta Approved Template
                        </button>
                    </div>
                )}

                <form onSubmit={onSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={`Ketik pesan ${activeTab === 'official' ? 'Official Meta...' : 'WhatsApp...'}`}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={sending || !inputMessage.trim()}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black text-white transition-all flex items-center gap-2 shadow-sm ${
                            sending || !inputMessage.trim()
                                ? 'bg-slate-300 cursor-not-allowed'
                                : activeTab === 'official'
                                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                        }`}
                    >
                        <span>Kirim</span>
                        <Send size={14} />
                    </button>
                </form>
            </div>
        </div>
    );
}
