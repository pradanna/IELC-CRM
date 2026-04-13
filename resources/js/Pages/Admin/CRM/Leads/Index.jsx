import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from '../partials/CrmLayout';
import FiltersBar from './partials/FiltersBar';
import LeadTable from './partials/LeadTable';
import DeleteLeadModal from './modals/DeleteLeadModal';
import SendWhatsappModal from './modals/SendWhatsappModal';
import { useLeadIndex } from './hooks/useLeadIndex';

export default function Index({ leads, filters, branches, phases, sources, types, provinces, chatTemplates, mediaAssets }) {
    const {
        isSuperadmin,
        deletingLead,
        isWhatsappModalOpen,
        whatsappLead,
        openLeadDetail,
        openWhatsappModal,
        closeWhatsappModal,
        openEditModal,
        handleDeleteClick,
        closeDeleteModal
    } = useLeadIndex(leads);

    return (
        <AuthenticatedLayout>
            <Head title="CRM Leads List" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout 
                    onSelectLead={(id) => openLeadDetail(id, 0)} 
                >
                    <div className="space-y-12">
                        {/* Filters Section */}
                        <FiltersBar 
                            filters={filters} 
                            branches={branches} 
                            phases={phases}
                            targetRoute="admin.crm.leads.list" 
                        />

                        {/* Premium Lead Table */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-l-4 border-red-500 pl-4">
                                Lead Records Management
                            </h3>
                            <LeadTable 
                                leads={leads} 
                                onView={openLeadDetail} 
                                onEdit={openEditModal}
                                onDelete={handleDeleteClick}
                                canDelete={isSuperadmin}
                            />
                        </div>
                    </div>
                </CrmLayout>
            </div>

            <DeleteLeadModal
                isOpen={!!deletingLead}
                onClose={closeDeleteModal}
                lead={deletingLead}
            />

            <SendWhatsappModal
                isOpen={isWhatsappModalOpen}
                onClose={closeWhatsappModal}
                lead={whatsappLead}
                chatTemplates={chatTemplates}
                mediaAssets={mediaAssets}
            />
        </AuthenticatedLayout>
    );
}
