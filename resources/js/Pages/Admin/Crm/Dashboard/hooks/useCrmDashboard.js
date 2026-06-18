import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';
import axios from 'axios';

export const useCrmDashboard = () => {
    const { openDrawer } = useLeadDrawer();


    const openLeadDetail = (id, tabIndex = 0) => {
        openDrawer(id, tabIndex);
    };

    const handleUpdatePhase = async (leadId, newPhaseId) => {
        try {
            await axios.patch(route('admin.crm.leads.update-phase', leadId), {
                lead_phase_id: newPhaseId
            });
            router.reload({ preserveScroll: true });
        } catch (error) {
            console.error('Error updating lead phase:', error);
        }
    };



    return {
        openLeadDetail,
        handleUpdatePhase,
    };
};
