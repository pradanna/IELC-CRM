import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export const useRegistrationInbox = (registrations, updateRequests) => {
    const { post, processing } = useForm();
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'updates'

    const handleApprove = (id, options = {}) => {
        if (confirm('Apakah Anda yakin ingin menyetujui (ACC) pendaftaran ini?')) {
            post(route('admin.crm.registrations.approve', id), options);
        }
    };

    const handleReject = (id, options = {}) => {
        if (confirm('Apakah Anda yakin ingin menolak pendaftaran ini?')) {
            post(route('admin.crm.registrations.reject', id), options);
        }
    };

    const handleApproveUpdate = (leadId, options = {}) => {
        if (confirm('Apakah Anda yakin ingin menyetujui pembaruan profil ini?')) {
            post(route('admin.crm.registrations.approve-update', leadId), options);
        }
    };

    const handleRejectUpdate = (leadId, options = {}) => {
        if (confirm('Apakah Anda yakin ingin menolak pembaruan profil ini?')) {
            post(route('admin.crm.registrations.reject-update', leadId), options);
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
