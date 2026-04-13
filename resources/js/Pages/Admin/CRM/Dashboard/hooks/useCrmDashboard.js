import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';
import axios from 'axios';

export const useCrmDashboard = () => {
    const { openDrawer } = useLeadDrawer();
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
    const [whatsappLead, setWhatsappLead] = useState(null);

    useEffect(() => {
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

    const closeWhatsappModal = () => {
        setIsWhatsappModalOpen(false);
        setWhatsappLead(null);
    };

    return {
        isWhatsappModalOpen,
        whatsappLead,
        openLeadDetail,
        handleUpdatePhase,
        closeWhatsappModal,
    };
};
