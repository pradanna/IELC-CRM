import { useState } from 'react';
import { router } from '@inertiajs/react';

export const useStudentIndex = (filters) => {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('admin.academic.students.index'), { ...filters, search }, { preserveState: true });
    };

    const handleFilterExpiry = (expiryStatus) => {
        router.get(route('admin.academic.students.index'), 
            { ...filters, search, expiry_status: expiryStatus }, 
            { preserveState: true }
        );
    };

    const handleFilterStatus = (status) => {
        router.get(route('admin.academic.students.index'), 
            { ...filters, search, status: status }, 
            { preserveState: true }
        );
    };

    const handleFilterCategory = (category) => {
        router.get(route('admin.academic.students.index'), 
            { ...filters, search, class_category: category }, 
            { preserveState: true }
        );
    };

    const handleFilterClass = (classId) => {
        router.get(route('admin.academic.students.index'), 
            { ...filters, search, study_class_id: classId }, 
            { preserveState: true }
        );
    };

    const handleSort = (field) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('admin.academic.students.index'), 
            { ...filters, search, sort_field: field, sort_direction: direction }, 
            { preserveState: true }
        );
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
