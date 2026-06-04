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
        
        // Front-end local calc for consultations and PTs (might be limited by loaded relationships)
        const consultationCount = leads.filter(l => (l.consultations?.length || 0) > 0).length;
        const ptCount = leads.filter(l => (l.pt_sessions?.length || 0) > 0).length;

        if (total === 0) {
            return {
                new_to_prospective: { percentage: 0, count: 0, total: 0 },
                prospective_to_consultation: { percentage: 0, count: 0, total: 0 },
                consultation_to_pt: { percentage: 0, count: 0, total: 0 },
                pt_to_closing: { percentage: 0, count: 0, total: 0 },
                new_to_closing: { percentage: 0, count: 0, total: 0 },
                prospective_to_closing: { percentage: 0, count: 0, total: 0 },
                consultation_to_closing: { percentage: 0, count: 0, total: 0 },
            };
        }

        return {
            new_to_prospective: {
                percentage: ((reachedProspectiveCount / total) * 100).toFixed(1),
                count: reachedProspectiveCount,
                total: total
            },
            prospective_to_consultation: {
                percentage: reachedProspectiveCount > 0 ? ((consultationCount / reachedProspectiveCount) * 100).toFixed(1) : 0,
                count: consultationCount,
                total: reachedProspectiveCount
            },
            consultation_to_pt: {
                percentage: consultationCount > 0 ? ((ptCount / consultationCount) * 100).toFixed(1) : 0,
                count: ptCount,
                total: consultationCount
            },
            pt_to_closing: {
                percentage: ptCount > 0 ? ((closingCount / ptCount) * 100).toFixed(1) : 0,
                count: closingCount,
                total: ptCount
            },
            new_to_closing: {
                percentage: ((closingCount / total) * 100).toFixed(1),
                count: closingCount,
                total: total
            },
            prospective_to_closing: {
                percentage: reachedProspectiveCount > 0 ? ((closingCount / reachedProspectiveCount) * 100).toFixed(1) : 0,
                count: closingCount,
                total: reachedProspectiveCount
            },
            consultation_to_closing: {
                percentage: consultationCount > 0 ? ((closingCount / consultationCount) * 100).toFixed(1) : 0,
                count: closingCount,
                total: consultationCount
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
