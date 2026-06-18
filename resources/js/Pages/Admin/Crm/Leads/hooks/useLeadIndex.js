import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';
import axios from 'axios';

export const useLeadIndex = (leads) => {
    const { auth } = usePage().props;
    const isSuperadmin = auth?.user?.role === 'superadmin' || auth?.user?.role === 'super-admin' || !!auth?.user?.superadmin;
    
    const [deletingLead, setDeletingLead] = useState(null);
    const { openDrawer } = useLeadDrawer();


    const openLeadDetail = (id, tabIndex = 0) => {
        openDrawer(id, tabIndex);
    };

    const openEditModal = async (leadId) => {
        try {
            const response = await axios.get(route('admin.crm.leads.show', leadId));
            document.dispatchEvent(new CustomEvent('openEditLeadModal', { detail: { lead: response.data.lead } }));
        } catch (e) {
            console.error('Failed to fetch lead for editing:', e);
        }
    };

    const handleDeleteClick = (id) => {
        const lead = leads.data.find(l => l.id === id);
        setDeletingLead(lead);
    };

    const closeDeleteModal = () => {
        setDeletingLead(null);
    };

    return {
        isSuperadmin,
        deletingLead,
        openLeadDetail,
        openEditModal,
        handleDeleteClick,
        closeDeleteModal
    };
};
