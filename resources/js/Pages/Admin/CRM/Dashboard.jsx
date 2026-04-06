import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from './partials/CrmLayout';
import FiltersBar from './partials/FiltersBar';
import TaskList from './partials/TaskList';
import EnrollmentTrendChart from './partials/EnrollmentTrendChart';
import StatsCard from '@/Pages/Admin/Dashboard/partials/StatsCard';
import CreateEditLeadModal from './modals/CreateEditLeadModal';
import LeadDetailDrawer from './drawers/LeadDetailDrawer';
import SendWhatsappModal from './modals/SendWhatsappModal';
import useLeadPhaseStyle from '@/Hooks/useLeadPhaseStyle';
import axios from 'axios';

export default function Dashboard({ data, branches, phases, sources, types, provinces, chatTemplates, mediaAssets }) {
    const { stats, tasks, trend, filters } = data;
    const [isLeadModalOpen, setIsLeadModalOpen] = React.useState(false);
    const [editingLead, setEditingLead] = React.useState(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = React.useState(false);
    const [drawerTabIndex, setDrawerTabIndex] = React.useState(0);
    const [selectedLeadId, setSelectedLeadId] = React.useState(null);
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = React.useState(false);
    const [whatsappLead, setWhatsappLead] = React.useState(null);
    
    const { getPhaseStyle } = useLeadPhaseStyle();

    const openLeadDetail = (id, tabIndex = 0) => {
        setDrawerTabIndex(tabIndex);
        setSelectedLeadId(id);
        setIsDetailDrawerOpen(true);
    };

    const openWhatsappModal = (lead) => {
        setWhatsappLead(lead);
        setIsWhatsappModalOpen(true);
    };

    const handleUpdatePhase = async (leadId, newPhaseId) => {
        try {
            await axios.patch(route('admin.crm.leads.update-phase', leadId), {
                lead_phase_id: newPhaseId
            });
            // Reload to update dashboard stats and counts
            router.reload({ preserveScroll: true });
        } catch (error) {
            console.error('Error updating lead phase:', error);
        }
    };

    const totalLeadsCard = { title: 'TOTAL LEADS', value: stats.total, icon: 'users', variant: 'primary' };

    const phaseCards = stats.phases.map(phase => ({
        value: phase.count,
        phaseCode: phase.code,
    }));

    return (
        <AuthenticatedLayout>
            <Head title="CRM Workspace" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout 
                    onNewLead={() => {
                        setEditingLead(null);
                        setIsLeadModalOpen(true);
                    }}
                    onSelectLead={(id) => openLeadDetail(id, 0)} 
                >
                    <div className="space-y-12">
                        {/* Global Filters Section */}
                        <FiltersBar 
                            filters={filters} 
                            branches={branches} 
                            phases={phases}
                            targetRoute="admin.crm.leads.index"
                        />

                        {/* Primary Stat Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                            <div className="lg:col-span-1">
                                <StatsCard {...totalLeadsCard} />
                            </div>
                            <div className="lg:col-span-2 flex flex-col justify-center">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Workspace Overview</h3>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                    Pantau performa pipeline recruitment dan konversi lead Anda secara real-time. 
                                    Total leads mencakup seluruh data yang masuk pada periode bulan ini.
                                </p>
                            </div>
                        </div>

                        {/* Phase KPIs Grid */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-l-4 border-red-500 pl-4">Lead Phases Breakdown</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {phaseCards.map((card, index) => (
                                    <StatsCard key={index} {...card} />
                                ))}
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-5 flex flex-col">
                                <TaskList 
                                    tasks={tasks} 
                                    phases={phases}
                                    getPhaseStyle={getPhaseStyle}
                                    onView={openLeadDetail}
                                    onUpdatePhase={handleUpdatePhase}
                                />
                            </div>
                            <div className="lg:col-span-7 flex flex-col">
                                <EnrollmentTrendChart trendData={trend} />
                            </div>
                        </div>
                    </div>
                </CrmLayout>
            </div>

            {/* Modals & Drawer */}
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
                phases={phases}
                chatTemplates={chatTemplates}
                mediaAssets={mediaAssets}
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
