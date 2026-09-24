import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PhoneCall, Settings, MessageSquare, RefreshCcw } from 'lucide-react';
import { useWhatsappInbox } from './hooks/useWhatsappInbox';
import BaileysInboxTab from './partials/BaileysInboxTab';

export default function Inbox({ branches = [], initialTab = 'baileys' }) {
    const {
        selectedBranch,
        setSelectedBranch,
        contacts,
        selectedContact,
        setSelectedContact,
        messages,
        inputMessage,
        setInputMessage,
        loadingContacts,
        loadingMessages,
        sending,
        searchQuery,
        setSearchQuery,
        handleSendMessage,
        refresh,
    } = useWhatsappInbox(branches, 'baileys');

    return (
        <AuthenticatedLayout>
            <Head title="WhatsApp Web - Inbox Center" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                                <MessageSquare size={16} />
                            </span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">CRM Communication Hub</p>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">WhatsApp Web (Inbox)</h1>
                    </div>

                    {/* Actions & Connection Info */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Channel Badge (Official is hidden for now) */}
                        <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-xs font-black shadow-sm">
                            <PhoneCall size={14} className="text-emerald-600" />
                            <span>WA Nomor Cabang</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                        </div>

                        {/* Refresh Button */}
                        <button
                            type="button"
                            onClick={refresh}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                            title="Segarkan Chat"
                        >
                            <RefreshCcw size={15} className={loadingContacts ? 'animate-spin text-emerald-600' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        {/* Settings Link */}
                        <Link
                            href={route('admin.whatsapp.index')}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                            title="Pengaturan Koneksi WA"
                        >
                            <Settings size={15} />
                            <span className="hidden sm:inline">Koneksi QR</span>
                        </Link>
                    </div>
                </div>

                {/* Baileys Multi-Device WhatsApp Web Content */}
                <BaileysInboxTab
                    branches={branches}
                    selectedBranch={selectedBranch}
                    setSelectedBranch={setSelectedBranch}
                    contacts={contacts}
                    selectedContact={selectedContact}
                    onSelectContact={setSelectedContact}
                    messages={messages}
                    loadingContacts={loadingContacts}
                    loadingMessages={loadingMessages}
                    inputMessage={inputMessage}
                    setInputMessage={setInputMessage}
                    onSendMessage={handleSendMessage}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    sending={sending}
                />
            </div>
        </AuthenticatedLayout>
    );
}
