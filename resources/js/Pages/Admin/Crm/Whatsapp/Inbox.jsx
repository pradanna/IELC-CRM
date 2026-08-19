import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ShieldCheck, PhoneCall, Settings, MessageSquare } from 'lucide-react';
import { useWhatsappInbox } from './hooks/useWhatsappInbox';
import OfficialInboxTab from './partials/OfficialInboxTab';
import BaileysInboxTab from './partials/BaileysInboxTab';
import TemplateSelectorModal from './modals/TemplateSelectorModal';

export default function Inbox({ branches = [], officialPhone, officialStatus }) {
    const {
        activeTab,
        setActiveTab,
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
        handleSendTemplate,
        isTemplateModalOpen,
        setIsTemplateModalOpen,
        templates,
        loadingTemplates,
        fetchTemplates,
    } = useWhatsappInbox(branches, 'official');

    const handleOpenTemplateModal = () => {
        setIsTemplateModalOpen(true);
        fetchTemplates();
    };

    return (
        <AuthenticatedLayout>
            <Head title="WhatsApp Inbox Center" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Top Header & Tab Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                                <MessageSquare size={16} />
                            </span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">CRM Communication Hub</p>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">WhatsApp Inbox Center</h1>
                    </div>

                    {/* Main Tabs Switcher (WA Official vs WA Baileys) */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl border border-slate-200/80">
                        <button
                            onClick={() => setActiveTab('official')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                                activeTab === 'official'
                                    ? 'bg-blue-600 text-white shadow-blue-500/20'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                            }`}
                        >
                            <ShieldCheck size={16} />
                            <span>📱 WA Official (API)</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('baileys')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                                activeTab === 'baileys'
                                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                            }`}
                        >
                            <PhoneCall size={16} />
                            <span>🔗 WA Baileys (Multi-Branch)</span>
                        </button>

                        <Link
                            href={route('admin.whatsapp.index')}
                            className="p-2.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-300/50 transition-all"
                            title="Pengaturan Koneksi WA"
                        >
                            <Settings size={16} />
                        </Link>
                    </div>
                </div>

                {/* Tab Views Content */}
                {activeTab === 'official' ? (
                    <OfficialInboxTab
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
                        onOpenTemplateModal={handleOpenTemplateModal}
                        sending={sending}
                        officialPhone={officialPhone}
                        officialStatus={officialStatus}
                    />
                ) : (
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
                )}
            </div>

            {/* Meta Template Modal for Official Tab */}
            <TemplateSelectorModal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                templates={templates}
                loading={loadingTemplates}
                onSendTemplate={handleSendTemplate}
            />
        </AuthenticatedLayout>
    );
}
