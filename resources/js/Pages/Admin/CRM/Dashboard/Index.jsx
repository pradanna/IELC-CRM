import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FiltersBar from '../Leads/partials/FiltersBar';
import DashboardFilters from './partials/DashboardFilters';
import TaskList from './partials/TaskList';
import EnrollmentTrendChart from './partials/EnrollmentTrendChart';
import StatsCard from '@/Pages/Admin/Dashboard/partials/StatsCard';
import SendWhatsappModal from '../Leads/modals/SendWhatsappModal';
import CrmLayout from '../partials/CrmLayout';
import useLeadPhaseStyle from '@/Hooks/useLeadPhaseStyle';
import { useCrmDashboard } from './hooks/useCrmDashboard';

export default function Index({ data, branches, phases, sources, types, provinces, chatTemplates, mediaAssets }) {
    const { stats, tasks, trend, filters } = data;
    const { getPhaseStyle } = useLeadPhaseStyle();
    
    const {
        isWhatsappModalOpen,
        whatsappLead,
        openLeadDetail,
        handleUpdatePhase,
        closeWhatsappModal,
    } = useCrmDashboard();

    /**
     * Normalizes a collection that might be a raw array or a wrapped resource object.
     */
    const normalizeCollection = (collection) => {
        if (Array.isArray(collection)) return collection;
        if (collection && Array.isArray(collection.data)) return collection.data;
        return [];
    };

    const normalizedBranches = normalizeCollection(branches);
    const normalizedPhases = normalizeCollection(phases);

    const monthName = new Date(filters.year, filters.month - 1).toLocaleString('id-ID', { month: 'long' });
    const periodLabel = `${monthName} ${filters.year}`;

    const totalLeadsCard = { title: 'TOTAL LEADS', value: stats.total, icon: 'users', variant: 'primary' };

    const phaseCards = stats.phases.map(phase => ({
        value: phase.count,
        phaseCode: phase.code,
        subtitle: phase.code === 'enrollment' ? periodLabel : null
    }));

    return (
        <AuthenticatedLayout>
            <Head title="CRM Workspace" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout 
                    onSelectLead={(id) => openLeadDetail(id, 0)} 
                >
                    <div className="space-y-12">
                        {/* Global Filters Section */}
                        <DashboardFilters 
                            filters={filters} 
                            branches={normalizedBranches} 
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
                                    phases={normalizedPhases}
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
