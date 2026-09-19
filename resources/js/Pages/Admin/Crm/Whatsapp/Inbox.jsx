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
    } = useWhatsappInbox(branches, 'baileys');

    const handleOpenTemplateModal = () => {
        setIsTemplateModalOpen(true);
        fetchTemplates();
    };

    return (
        <AuthenticatedLayout>
            <Head title="WhatsApp Inbox Center" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                                <MessageSquare size={16} />
                            </span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">CRM Communication Hub</p>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">WhatsApp Inbox Center</h1>
                    </div>

                    {/* Quick Settings & Navigation */}
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('admin.whatsapp.index')}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                            title="Pengaturan Koneksi WA"
                        >
                            <Settings size={16} />
                            <span>Pengaturan WA</span>
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
