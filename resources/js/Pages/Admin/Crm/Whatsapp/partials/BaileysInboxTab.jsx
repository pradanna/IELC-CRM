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
                            <h4 className="text-xs font-black uppercase tracking-wider">WhatsApp Baileys Gateway Channel</h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Device Connected
                            </span>
                        </div>
                        <p className="text-[11px] text-emerald-200/80 mt-0.5">Pengiriman bebas langsung via perangkat nomor cabang</p>
                    </div>
                </div>

                {/* Branch Switcher Selector */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                        <Building2 size={14} /> Cabang / Branch:
                    </label>
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                        {branches.map((b) => (
                            <option key={b.id} value={b.code} className="text-slate-900">
                                {b.name} ({b.code.toUpperCase()})
                            </option>
                        ))}
                    </select>
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
