import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

export default function OfficialInboxTab({
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
    onOpenTemplateModal,
    sending,
    officialPhone,
    officialStatus,
}) {
    return (
        <div className="flex flex-col h-[calc(100vh-140px)] rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Tab Sub-Header Status */}
            <div className="px-6 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 text-white">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black uppercase tracking-wider">WhatsApp Official Channel (Meta Cloud API)</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${
                                officialStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            }`}>
                                {officialStatus === 'connected' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {officialStatus === 'connected' ? 'Meta Token Active' : 'Check Token'}
                            </span>
                        </div>
                        <p className="text-[11px] text-blue-200/80 font-mono mt-0.5">Official WABA Number: {officialPhone}</p>
                    </div>
                </div>

                <div className="text-[11px] text-blue-100/70 font-medium">
                    Verified Meta Business Account
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
                    activeTab="official"
                />

                <ChatWindow
                    selectedContact={selectedContact}
                    messages={messages}
                    loadingMessages={loadingMessages}
                    inputMessage={inputMessage}
                    setInputMessage={setInputMessage}
                    onSendMessage={onSendMessage}
                    activeTab="official"
                    onOpenTemplateModal={onOpenTemplateModal}
                    sending={sending}
                />
            </div>
        </div>
    );
}
