import { useMemo } from 'react';

export function useDashboard(stats) {
    const summaryCards = useMemo(() => [
        {
            title: 'TOTAL STUDENTS',
            value: stats.summary.total_students,
            icon: 'users',
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
        },
        {
            title: 'HOT LEADS',
            value: stats.summary.hot_leads,
            icon: 'flame',
            color: 'text-orange-500',
            bg: 'bg-orange-50',
        },
        {
            title: 'FOLLOW-UP HEALTH',
            value: stats.summary.follow_up_health,
            icon: 'clipboard-list',
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
        },
        {
            title: 'NEW LEADS (THIS MONTH)',
            value: stats.summary.new_leads_this_month,
            icon: 'user-plus',
            color: 'text-sky-500',
            bg: 'bg-sky-50',
        },
    ], [stats.summary]);

    const performanceData = useMemo(() => stats.branch_performance, [stats.branch_performance]);

    const sourceData = useMemo(() => stats.lead_sources, [stats.lead_sources]);

    const totalLeads = useMemo(() => 
        sourceData.reduce((acc, curr) => acc + curr.count, 0)
    , [sourceData]);

    const cityData = useMemo(() => stats.leads_by_city, [stats.leads_by_city]);

    return {
        summaryCards,
        performanceData,
        sourceData,
        totalLeads,
        cityData,
    };
}
