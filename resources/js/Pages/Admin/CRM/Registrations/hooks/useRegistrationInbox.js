import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useRegistrationInbox = (registrations, updateRequests) => {
    const { post, processing } = useForm();
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'updates'

    const handleApprove = (id) => {
        if (confirm('Apakah Anda yakin ingin menyetujui (ACC) pendaftaran ini?')) {
            post(route('admin.crm.registrations.approve', id));
        }
    };

    const handleReject = (id) => {
        if (confirm('Apakah Anda yakin ingin menolak pendaftaran ini?')) {
            post(route('admin.crm.registrations.reject', id));
        }
    };

    const handleApproveUpdate = (leadId) => {
        if (confirm('Apakah Anda yakin ingin menyetujui pembaruan profil ini?')) {
            post(route('admin.crm.registrations.approve-update', leadId));
        }
    };

    const handleRejectUpdate = (leadId) => {
        if (confirm('Apakah Anda yakin ingin menolak pembaruan profil ini?')) {
            post(route('admin.crm.registrations.reject-update', leadId));
        }
    };

    const currentItems = activeTab === 'new' ? registrations : updateRequests;

    return {
        activeTab,
        setActiveTab,
        currentItems,
        processing,
        handleApprove,
        handleReject,
        handleApproveUpdate,
        handleRejectUpdate
    };
};
