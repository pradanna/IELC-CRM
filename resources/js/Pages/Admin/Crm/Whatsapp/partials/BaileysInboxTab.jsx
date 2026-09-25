import React from 'react';
import { PhoneCall, Building2, CheckCircle2 } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

export default function BaileysInboxTab({
    branches,
    selectedBranch,
    setSelectedBranch,
    contacts,
    selectedContact,
    onSelectContact,
    messages,
    loadingContacts,
    loadingMessages,
    inputMessage,
    setInputMessage,
    onSendMessage,
    searchQuery,
    setSearchQuery,
    sending,
}) {
    return (
        <div className="flex flex-col h-[calc(100vh-140px)] rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Tab Sub-Header Status with Branch Switcher */}
            <div className="px-6 py-3 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                        <PhoneCall size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase tracking-wider">WhatsApp Web (Satu Pintu / Terpusat)</h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Device Connected
                            </span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80 mt-0.5">Semua percakapan masuk & keluar terhubung dalam satu inbox</p>
                    </div>
                </div>

                {/* Unified Branch Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white shadow-xs">
                    <Building2 size={14} className="text-emerald-300" />
                    <span>Inbox Terpusat (Semua Chat Jadi 1)</span>
                </div>
            </div>

            {/* Chat Layout 2 Columns */}
            <div className="flex-1 flex overflow-hidden">
                <ChatSidebar
                    contacts={contacts}
                    selectedContact={selectedContact}
                    onSelectContact={onSelectContact}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    loading={loadingContacts}
                    activeTab="baileys"
                />

                <ChatWindow
                    selectedContact={selectedContact}
                    messages={messages}
                    loadingMessages={loadingMessages}
                    inputMessage={inputMessage}
                    setInputMessage={setInputMessage}
                    onSendMessage={onSendMessage}
                    activeTab="baileys"
                    sending={sending}
                />
            </div>
        </div>
    );
}
