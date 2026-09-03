import React from 'react';
import { Search, UserCheck, ShieldCheck, PhoneCall } from 'lucide-react';

export default function ChatSidebar({
    contacts,
    selectedContact,
    onSelectContact,
    searchQuery,
    setSearchQuery,
    loading,
    activeTab,
}) {
    return (
        <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200/80 flex flex-col h-full">
            {/* Search Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Cari percakapan ${activeTab === 'official' ? 'Official' : 'Baileys'}...`}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {loading ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                        <div className="animate-spin w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto" />
                        <p>Memuat percakapan...</p>
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                        Tidak ada percakapan ditemukan.
                    </div>
                ) : (
                    contacts.map((contact) => {
                        const isSelected = selectedContact?.id === contact.id;
                        return (
                            <div
                                key={contact.id}
                                onClick={() => onSelectContact(contact)}
                                className={`p-4 flex items-start gap-3.5 cursor-pointer transition-all hover:bg-slate-50/80 ${
                                    isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                                }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200/60 flex items-center justify-center font-black text-slate-600 text-sm shadow-sm">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full text-white text-[9px] ${
                                        activeTab === 'official' ? 'bg-blue-600' : 'bg-emerald-600'
                                    }`}>
                                        {activeTab === 'official' ? <ShieldCheck size={10} /> : <PhoneCall size={10} />}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                        <h4 className="text-xs font-black text-slate-900 truncate">
                                            {contact.name}
                                        </h4>
                                        <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                                            {contact.last_message_time}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">
                                        {contact.last_message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {contact.type}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            {contact.phone}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
