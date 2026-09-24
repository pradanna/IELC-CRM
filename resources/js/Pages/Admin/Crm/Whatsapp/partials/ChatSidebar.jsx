import React from 'react';
import { router } from '@inertiajs/react';
import { Search, UserCheck, ShieldCheck, PhoneCall, UserPlus } from 'lucide-react';

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
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau nomor WhatsApp..."
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 custom-scrollbar">
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
                                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50 ${
                                    isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : ''
                                }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${
                                        activeTab === 'official' 
                                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full text-white text-[9px] shadow-sm ${
                                        activeTab === 'official' ? 'bg-blue-600' : 'bg-emerald-600'
                                    }`}>
                                        {activeTab === 'official' ? <ShieldCheck size={10} /> : <PhoneCall size={10} />}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <h4 className={`text-xs truncate ${
                                            contact.name === 'No Name' 
                                                ? 'font-bold text-slate-700 italic' 
                                                : 'font-black text-slate-900'
                                        }`}>
                                            {contact.name || 'No Name'}
                                        </h4>
                                        <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
                                            {contact.last_message_time}
                                        </span>
                                    </div>

                                    {/* Prominent Phone Number */}
                                    <div className="text-[11px] font-bold text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                                        <span>{contact.phone}</span>
                                    </div>

                                    <p className="text-xs text-slate-500 truncate mt-0.5 leading-snug">
                                        {contact.last_message}
                                    </p>

                                    <div className="flex items-center justify-between gap-1.5 mt-2">
                                        {contact.name === 'No Name' || contact.type === 'non-lead' || !contact.is_lead ? (
                                            <>
                                                <div className="flex items-center gap-1">
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black uppercase tracking-wider">
                                                        Belum Jadi Lead
                                                    </span>
                                                    {contact.branch_code && (
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                                                            {contact.branch_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const clean = (contact.phone || '').replace(/[^0-9]/g, '');
                                                        router.visit(route('admin.crm.leads.list', { create_lead: 1, phone: clean }));
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition-all active:scale-95 cursor-pointer ml-auto"
                                                    title="Daftarkan nomor WhatsApp ini sebagai Lead baru"
                                                >
                                                    <UserPlus size={11} />
                                                    <span>+ Buat Lead</span>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider">
                                                    {contact.type || 'Lead'}
                                                </span>
                                                {contact.branch_code && (
                                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase tracking-wider">
                                                        {contact.branch_code}
                                                    </span>
                                                )}
                                            </div>
                                        )}
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
