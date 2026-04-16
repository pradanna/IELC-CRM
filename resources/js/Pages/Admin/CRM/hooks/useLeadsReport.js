import { useMemo } from "react";

export function useLeadsReport({ 
    leads = [], 
    sources = [], 
    phases = [], 
    branches = [],
    newLeadsCount,
    enrolledLeadsCount 
}) {
    // 1. Leads by Source
    const sourceData = useMemo(() => {
        const counts = leads.reduce((acc, lead) => {
            const sourceId = lead.lead_source_id;
            acc[sourceId] = (acc[sourceId] || 0) + 1;
            return acc;
        }, {});

        return sources
            .map((source) => ({
                name: source.name,
                value: counts[source.id] || 0,
            }))
            .sort((a, b) => b.value - a.value);
    }, [leads, sources]);

    // 2. Leads by Phase (Conversion Funnel)
    const phaseData = useMemo(() => {
        const counts = leads.reduce((acc, lead) => {
            const phaseId = lead.lead_phase_id;
            acc[phaseId] = (acc[phaseId] || 0) + 1;
            return acc;
        }, {});

        return phases.map((phase) => ({
            name: phase.name,
            value: counts[phase.id] || 0,
            code: phase.code
        }));
    }, [leads, phases]);

    // 3. Leads by Branch
    const branchData = useMemo(() => {
        const counts = leads.reduce((acc, lead) => {
            const branchId = lead.branch_id;
            acc[branchId] = (acc[branchId] || 0) + 1;
            return acc;
        }, {});

        return branches.map((branch) => ({
            name: branch.name,
            value: counts[branch.id] || 0,
        })).sort((a, b) => b.value - a.value);
    }, [leads, branches]);

    // 4. Detailed Success Rates
    const successRates = useMemo(() => {
        const total = newLeadsCount !== undefined ? newLeadsCount : leads.length;
        const reachedProspectiveCount = leads.filter(l => !!l.reached_prospective_at).length;
        const closingCount = enrolledLeadsCount !== undefined ? enrolledLeadsCount : leads.filter(l => !!l.enrolled_at).length;
        const lostCount = leads.filter(l => !!l.lost_at).length;
        const lostAfterProspectiveCount = leads.filter(l => !!l.lost_at && !!l.reached_prospective_at).length;

        if (total === 0) {
            return {
                newToProspective: { percentage: 0, count: 0, total: 0 },
                newToClosing: { percentage: 0, count: 0, total: 0 },
                newToLost: { percentage: 0, count: 0, total: 0 },
                prospectiveToClosing: { percentage: 0, count: 0, total: 0 },
                prospectiveToLost: { percentage: 0, count: 0, total: 0 },
            };
        }

        return {
            newToProspective: {
                percentage: ((reachedProspectiveCount / total) * 100).toFixed(1),
                count: reachedProspectiveCount,
                total: total
            },
            newToClosing: {
                percentage: ((closingCount / total) * 100).toFixed(1),
                count: closingCount,
                total: total
            },
            newToLost: {
                percentage: ((lostCount / total) * 100).toFixed(1),
                count: lostCount,
                total: total
            },
            prospectiveToClosing: {
                percentage: reachedProspectiveCount > 0 ? ((closingCount / reachedProspectiveCount) * 100).toFixed(1) : 0,
                count: closingCount,
                total: reachedProspectiveCount
            },
            prospectiveToLost: {
                percentage: reachedProspectiveCount > 0 ? ((lostAfterProspectiveCount / reachedProspectiveCount) * 100).toFixed(1) : 0,
                count: lostAfterProspectiveCount,
                total: reachedProspectiveCount
            },
        };
    }, [leads, newLeadsCount, enrolledLeadsCount]);

    // 5. Basic Stats
    const stats = useMemo(() => {
        const total = newLeadsCount !== undefined ? newLeadsCount : leads.length;
        const joined = enrolledLeadsCount !== undefined ? enrolledLeadsCount : leads.filter(l => {
            const phaseCode = (l.lead_phase?.code || "").toLowerCase();
            return phaseCode === 'enrollment' || phaseCode === 'enrolled' || !!l.enrolled_at;
        }).length;

        const conversionRate = total > 0 ? ((joined / total) * 100).toFixed(1) : 0;

        return {
            total,
            joined,
            conversionRate
        };
    }, [leads, newLeadsCount, enrolledLeadsCount]);

    return {
        sourceData,
        phaseData,
        branchData,
        stats,
        successRates
    };
}
