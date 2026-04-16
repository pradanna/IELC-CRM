import { useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export function useLeadPlacementTest({ lead, onRefresh }) {
    const [generating, setGenerating] = useState(false);
    const [sendingWa, setSendingWa] = useState(null); // ID of session being sent
    const [selectedExamId, setSelectedExamId] = useState('');
    const [copySuccess, setCopySuccess] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null); // ID of session being deleted

    const handleGenerateLink = async () => {
        if (!selectedExamId) return;
        
        setGenerating(true);
        try {
            await axios.post(route('admin.crm.pt-sessions.store'), {
                lead_id: lead.id,
                pt_exam_id: selectedExamId
            });
            setSelectedExamId('');
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error generating placement test link:', error);
            // Error will be handled by Toast automatically if backend returns error flash
        } finally {
            setGenerating(false);
        }
    };

    const handleSendWa = async (session) => {
        if (!lead?.phone) {
            alert('Nomor WhatsApp lead tidak ditemukan.'); // Keep for now, or replace with toast
            return;
        }

        setSendingWa(session.id);
        try {
            const branchCode = (lead?.branch_code || 'solo').toLowerCase();
            const message = `Halo ${lead.name}, ini adalah link placement test kamu: ${session.magic_link}\n\nHarap dikerjakan sesuai waktu yang ditentukan ya. Semangat!\n\nIELC - International English Language Center`;
            
            await axios.post(route('admin.whatsapp.send'), {
                branch: branchCode,
                phone: lead.phone,
                message: message
            });
            
            // Success toast will be triggered by response flash if implement in controller
        } catch (error) {
            console.error('Error sending WA:', error);
        } finally {
            setSendingWa(null);
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(id);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleDelete = async (id) => {
        setIsDeleting(id);
        try {
            await axios.delete(route('admin.crm.pt-sessions.destroy', id));
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Error deleting session:', error);
        } finally {
            setIsDeleting(null);
        }
    };

    return {
        generating,
        sendingWa,
        selectedExamId,
        setSelectedExamId,
        copySuccess,
        isDeleting,
        handleGenerateLink,
        handleSendWa,
        handleCopy,
        handleDelete,
    };
}
