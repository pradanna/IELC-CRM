import { Head, Link, router } from '@inertiajs/react';
import { Building2, AlertTriangle } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FiltersBar from '../Leads/partials/FiltersBar';
import DashboardFilters from './partials/DashboardFilters';
import TaskList from './partials/TaskList';
import EnrollmentTrendChart from './partials/EnrollmentTrendChart';
import StatsCard from '@/Pages/Admin/Dashboard/partials/StatsCard';
import CrmLayout from '../partials/CrmLayout';
import useLeadPhaseStyle from '@/Hooks/useLeadPhaseStyle';
import { useCrmDashboard } from './hooks/useCrmDashboard';
import ExpiringStudentsList from './partials/ExpiringStudentsList';

export default function Index({ data, branches, phases, sources, infoSources, types, provinces, chatTemplates, mediaAssets }) {
    const { stats, tasks, trend, filters, expiringStudents = [], unassigned_branch_leads_count = 0 } = data;
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

    const hasDateFilter = filters.month && filters.year;
    const monthName = hasDateFilter ? new Date(filters.year, filters.month - 1).toLocaleString('id-ID', { month: 'long' }) : '';
    const periodLabel = hasDateFilter ? `${monthName} ${filters.year}` : 'All Time';

    const activePhases = ['lead', 'prospect', 'consultation', 'placement-test', 'pre-enrollment', 'invoice'];
    const closedPhases = ['enrollment', 'cold-leads', 'dropout-leads'];

    const handlePhaseCardClick = (phaseId) => {
        const queryParams = {};
        if (phaseId) {
            queryParams.lead_phase_id = phaseId;
        }
        if (filters.branch_id) {
            queryParams.branch_id = filters.branch_id;
        }
        router.get(route('admin.crm.leads.list'), queryParams);
    };

    const totalLeadsCard = { 
        title: hasDateFilter ? 'NEW LEADS AKTIF' : 'TOTAL LEADS AKTIF', 
        value: stats.total, 
        icon: 'users', 
        variant: 'primary', 
        subtitle: periodLabel,
        onClick: () => handlePhaseCardClick()
    };

    const activeCards = stats.phases
        .filter(phase => activePhases.includes(phase.code))
        .map(phase => ({
            value: phase.count,
            phaseCode: phase.code,
            subtitle: null,
            onClick: () => handlePhaseCardClick(phase.id)
        }));

    const closedCards = stats.phases
        .filter(phase => closedPhases.includes(phase.code))
        .map(phase => ({
            value: phase.count,
            phaseCode: phase.code,
            subtitle: periodLabel,
            onClick: () => handlePhaseCardClick(phase.id)
        }));

    return (
        <AuthenticatedLayout>
            <Head title="CRM Workspace" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout 
                    onSelectLead={(id) => openLeadDetail(id, 0)} 
                    branches={normalizedBranches}
                    phases={normalizedPhases}
                    sources={normalizeCollection(sources)}
                    infoSources={normalizeCollection(infoSources)}
                    types={normalizeCollection(types)}
                    provinces={provinces}
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
                                    {hasDateFilter 
                                        ? 'New leads mencakup data lead aktif yang masuk pada periode bulan terfilter.' 
                                        : 'Total leads mencakup seluruh data lead aktif yang ada di sistem.'}
                                </p>

                                {unassigned_branch_leads_count > 0 && (
                                    <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                                <AlertTriangle size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-amber-900">Perhatian: Lead Tanpa Cabang</p>
                                                <p className="text-[11px] font-medium text-amber-700">
                                                    Terdapat <span className="font-black text-amber-900">{unassigned_branch_leads_count} lead</span> yang belum terhubung dengan Target Branch.
                                                </p>
                                            </div>
                                        </div>
                                        <Link 
                                            href={route('admin.crm.leads.list', { branch_id: 'unassigned' })}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm"
                                        >
                                            Lihat Lead
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Active Pipeline KPIs Grid */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-indigo-500 pl-4">Pipeline Leads Aktif</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                                {activeCards.map((card, index) => (
                                    <StatsCard key={index} {...card} />
                                ))}
                            </div>
                        </div>

                        {/* Completed / Closed Outcomes KPIs Grid */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Hasil Konversi & Status Akhir (Closed)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {closedCards.map((card, index) => (
                                    <StatsCard key={index} {...card} />
                                ))}
                            </div>
                        </div>


                        {/* Tasks & Expiry Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            <TaskList 
                                tasks={tasks} 
                                phases={normalizedPhases}
                                getPhaseStyle={getPhaseStyle}
                                onView={openLeadDetail}
                                onUpdatePhase={handleUpdatePhase}
                            />
                            
                            <ExpiringStudentsList 
                                students={expiringStudents} 
                                onView={openLeadDetail}
                            />
                        </div>

                        {/* Chart Row - Full Width */}
                        <div className="pt-4">
                            <EnrollmentTrendChart trendData={trend} />
                        </div>
                    </div>
                </CrmLayout>
            </div>

        </AuthenticatedLayout>
    );
}
