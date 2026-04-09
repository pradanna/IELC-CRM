import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from './partials/CrmLayout';
import FiltersBar from './partials/FiltersBar';
import LeadTable from './partials/LeadTable';
import DeleteLeadModal from './modals/DeleteLeadModal';
import { useState } from 'react';
import SendWhatsappModal from './modals/SendWhatsappModal';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';
import axios from 'axios';

export default function ListView({ leads, filters, branches, phases, sources, types, provinces, chatTemplates, mediaAssets }) {
    const { auth, flash } = usePage().props;
    const isSuperadmin = auth?.user?.role === 'superadmin';
    
    const [deletingLead, setDeletingLead] = React.useState(null);

    const { openDrawer, isOpen: isDetailDrawerOpen } = useLeadDrawer();

    // WhatsApp Modal State
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = React.useState(false);
    const [whatsappLead, setWhatsappLead] = React.useState(null);

    React.useEffect(() => {
        const handleWhatsapp = (e) => {
            setWhatsappLead(e.detail.lead);
            setIsWhatsappModalOpen(true);
        };
        document.addEventListener('openSendWhatsappModal', handleWhatsapp);
        return () => {
            document.removeEventListener('openSendWhatsappModal', handleWhatsapp);
        };
    }, []);


    const openLeadDetail = (id, tabIndex = 0) => {
        openDrawer(id, tabIndex);
    };

    const openWhatsappModal = (lead) => {
        setWhatsappLead(lead);
        setIsWhatsappModalOpen(true);
    };

    const openEditModal = async (leadId) => {
        try {
            const response = await axios.get(route('admin.crm.leads.show', leadId));
            document.dispatchEvent(new CustomEvent('openEditLeadModal', { detail: { lead: response.data.lead } }));
        } catch (e) {
            console.error('Failed to fetch lead for editing:', e);
        }
    };


    return (
        <AuthenticatedLayout>
            <Head title="CRM Leads List" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout 
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


            <DeleteLeadModal
                isOpen={!!deletingLead}
                onClose={() => setDeletingLead(null)}
                lead={deletingLead}
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
