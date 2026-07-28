import { useState } from 'react';
import { router } from '@inertiajs/react';

export const useStudentIndex = (filters) => {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const params = { ...filters, search, mainTab: 'list' };
        router.get('/admin/academic/students', params, { preserveState: true, preserveScroll: true });
    };

    const handleFilterExpiry = (expiryStatus) => {
        const params = { ...filters, search, expiry_status: expiryStatus, mainTab: 'list' };
        router.get('/admin/academic/students', params, { preserveState: true, preserveScroll: true });
    };

    const handleFilterStatus = (status) => {
        const params = { ...filters, search, status: status, mainTab: 'list' };
        router.get('/admin/academic/students', params, { preserveState: true, preserveScroll: true });
    };

    const handleFilterCategory = (category) => {
        const params = { ...filters, search, class_category: category, mainTab: 'list' };
        router.get('/admin/academic/students', params, { preserveState: true, preserveScroll: true });
    };

    const handleFilterClass = (classId) => {
        const params = { ...filters, search, study_class_id: classId, mainTab: 'list' };
        router.get('/admin/academic/students', params, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        const params = { ...filters, search, sort_field: field, sort_direction: direction, mainTab: 'list' };
        router.get('/admin/academic/students', params, { preserveState: true, preserveScroll: true });
    };

    return {
        search,
        setSearch,
        handleSearch,
        handleFilterExpiry,
        handleFilterStatus,
        handleFilterCategory,
        handleFilterClass,
        handleSort
    };
};
