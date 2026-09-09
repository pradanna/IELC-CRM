import React from 'react';
import { Send, FileCode, CheckCheck, Check, ShieldCheck, PhoneCall, User } from 'lucide-react';

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
    if (!selectedContact) {
        return (
            <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-300 mb-4">
                    {activeTab === 'official' ? <ShieldCheck size={32} /> : <PhoneCall size={32} />}
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                    Pilih Percakapan
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                    Pilih kontak di sebelah kiri untuk melihat pesan {activeTab === 'official' ? 'WA Official' : 'WA Baileys'}.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex flex-col h-full overflow-hidden">
            {/* Top Chat Header */}
            <div className="px-6 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shadow-sm">
                        {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">{selectedContact.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                activeTab === 'official' 
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}>
                                {activeTab === 'official' ? 'Official Meta API' : 'Baileys Device'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{selectedContact.phone}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedContact.crm_id && (
                        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                            <User size={13} />
                            Profil CRM
                        </button>
                    )}
                </div>
            </div>

            {/* Message History Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                        Belum ada riwayat pesan.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isAdmin = msg.sender === 'admin';
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm text-xs leading-relaxed ${
                                    isAdmin
                                        ? activeTab === 'official'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                                }`}>
                                    {msg.template_name && (
                                        <div className="mb-1 pb-1 border-b border-white/20 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
                                            <FileCode size={11} /> Template: {msg.template_name}
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
                                        isAdmin ? 'text-white/80' : 'text-slate-400'
                                    }`}>
                                        <span>{msg.timestamp}</span>
                                        {isAdmin && (
                                            msg.status === 'read' ? <CheckCheck size={12} className="text-sky-300" /> : <Check size={12} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200/80 flex-shrink-0">
                {activeTab === 'official' && (
                    <div className="mb-2.5 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onOpenTemplateModal}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                            <FileCode size={13} />
                            Gunakan Meta WA Template (Official)
                        </button>
                    </div>
                )}

                <form onSubmit={onSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={`Ketik pesan ${activeTab === 'official' ? 'official...' : 'bebas...'}`}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={sending || !inputMessage.trim()}
                        className={`px-5 py-3 rounded-xl text-xs font-black text-white transition-all flex items-center gap-2 shadow-sm ${
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
