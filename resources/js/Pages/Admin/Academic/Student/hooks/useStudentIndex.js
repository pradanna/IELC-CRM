import { useState } from 'react';
import { router } from '@inertiajs/react';

export const useStudentIndex = (filters) => {
    const [search, setSearch] = useState(filters.search || '');

    const navigateWithFilters = (updatedFilters) => {
        const base = {
            search: search,
            status: filters.status,
            branch_id: filters.branch_id,
            class_category: filters.class_category,
            study_class_id: filters.study_class_id,
            price_master_id: filters.price_master_id,
            grade: filters.grade,
            loyalty_tier: filters.loyalty_tier,
            expiry_status: filters.expiry_status,
            sort_field: filters.sort_field,
            sort_direction: filters.sort_direction,
            mainTab: 'list',
            ...updatedFilters,
        };

        const cleanParams = {};
        Object.entries(base).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '') {
                cleanParams[key] = val;
            }
        });

        // Always ensure mainTab is set
        cleanParams.mainTab = 'list';

        router.get('/admin/academic/students', cleanParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        navigateWithFilters({ search });
    };

    const handleFilterExpiry = (expiryStatus) => {
        navigateWithFilters({ expiry_status: expiryStatus });
    };

    const handleFilterStatus = (status) => {
        navigateWithFilters({ status: status });
    };

    const handleFilterCategory = (category) => {
        navigateWithFilters({ class_category: category });
    };

    const handleFilterClass = (classId) => {
        navigateWithFilters({ study_class_id: classId });
    };

    const handleFilterGrade = (grade) => {
        navigateWithFilters({ grade: grade });
    };

    const handleFilterPriceMaster = (priceMasterId) => {
        navigateWithFilters({ price_master_id: priceMasterId });
    };

    const handleFilterBranch = (branchId) => {
        navigateWithFilters({ branch_id: branchId });
    };

    const handleFilterLoyaltyTier = (tier) => {
        navigateWithFilters({ loyalty_tier: tier });
    };

    const handleSort = (field) => {
        const direction = filters.sort_field === field && filters.sort_direction === 'asc' ? 'desc' : 'asc';
        navigateWithFilters({ sort_field: field, sort_direction: direction });
    };

    return {
        search,
        setSearch,
        handleSearch,
        handleFilterExpiry,
        handleFilterStatus,
        handleFilterCategory,
        handleFilterClass,
        handleFilterPriceMaster,
        handleFilterGrade,
        handleFilterBranch,
        handleFilterLoyaltyTier,
        handleSort,
        navigateWithFilters,
    };
};
