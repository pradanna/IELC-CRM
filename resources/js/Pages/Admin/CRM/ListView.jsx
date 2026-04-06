import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from './partials/CrmLayout';
import FiltersBar from './partials/FiltersBar';
import LeadTable from './partials/LeadTable';
import CreateEditLeadModal from './modals/CreateEditLeadModal';
import DeleteLeadModal from './modals/DeleteLeadModal';
import LeadDetailDrawer from './drawers/LeadDetailDrawer';
import SendWhatsappModal from './modals/SendWhatsappModal';
import axios from 'axios';

export default function ListView({ leads, filters, branches, phases, sources, types, provinces, chatTemplates, mediaAssets }) {
    const { auth, flash } = usePage().props;
    const isSuperadmin = auth?.user?.role === 'superadmin';
    
    const [isLeadModalOpen, setIsLeadModalOpen] = React.useState(false);
    const [editingLead, setEditingLead] = React.useState(null);
    const [selectedLeadId, setSelectedLeadId] = React.useState(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = React.useState(false);
    const [drawerTabIndex, setDrawerTabIndex] = React.useState(0);
    const [deletingLead, setDeletingLead] = React.useState(null);

    // WhatsApp Modal State
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = React.useState(false);
    const [whatsappLead, setWhatsappLead] = React.useState(null);

    const openLeadDetail = (id, tabIndex = 0) => {
        setDrawerTabIndex(tabIndex);
        setSelectedLeadId(id);
        setIsDetailDrawerOpen(true);
    };

    const openWhatsappModal = (lead) => {
        setWhatsappLead(lead);
        setIsWhatsappModalOpen(true);
    };

    const openEditModal = async (leadId) => {
        try {
            const response = await axios.get(route('admin.crm.leads.show', leadId));
            setEditingLead(response.data.lead);
            setIsLeadModalOpen(true);
        } catch (e) {
            console.error('Failed to fetch lead for editing:', e);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="CRM Leads List" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout 
                    onNewLead={() => {
                        setEditingLead(null);
                        setIsLeadModalOpen(true);
                    }}
                    onSelectLead={(id) => openLeadDetail(id, 0)} 
                >
                    <div className="space-y-12">
                        {/* Filters Section (Updated for List View) */}
                        <FiltersBar 
                            filters={filters} 
                            branches={branches} 
                            phases={phases}
                            targetRoute="admin.crm.leads.list" 
                        />

                        {/* Premium Lead Table */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-l-4 border-red-500 pl-4">Lead Records Management</h3>
                            <LeadTable 
                                leads={leads} 
                                onView={openLeadDetail} 
                                onEdit={openEditModal}
                                onDelete={(id) => {
                                    const lead = leads.data.find(l => l.id === id);
                                    setDeletingLead(lead);
                                }}
                                canDelete={isSuperadmin}
                            />
                        </div>
                    </div>
                </CrmLayout>
            </div>

            {/* Modals & Drawers */}
            <CreateEditLeadModal 
                isOpen={isLeadModalOpen} 
                onClose={() => {
                    setIsLeadModalOpen(false);
                    setEditingLead(null);
                }}
                onSaveSuccess={(newLeadId) => {
                    if (newLeadId) openLeadDetail(newLeadId, 2);
                }}
                lead={editingLead}
                branches={branches}
                sources={sources}
                types={types}
                provinces={provinces}
            />

            <DeleteLeadModal
                isOpen={!!deletingLead}
                onClose={() => setDeletingLead(null)}
                lead={deletingLead}
            />

            <LeadDetailDrawer 
                leadId={selectedLeadId}
                isOpen={isDetailDrawerOpen}
                initialTabIndex={drawerTabIndex}
                onClose={() => setIsDetailDrawerOpen(false)}
                onEditLead={(lead) => {
                    setEditingLead(lead);
                    setIsLeadModalOpen(true);
                }}
                onOpenWhatsapp={openWhatsappModal}
                chatTemplates={chatTemplates}
                mediaAssets={mediaAssets}
                phases={phases}
            />

            <SendWhatsappModal
                isOpen={isWhatsappModalOpen}
                onClose={() => {
                    setIsWhatsappModalOpen(false);
                    setWhatsappLead(null);
                }}
                lead={whatsappLead}
                chatTemplates={chatTemplates}
                mediaAssets={mediaAssets}
            />
        </AuthenticatedLayout>
    );
}
