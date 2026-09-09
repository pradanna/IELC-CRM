import { useState } from 'react';
import { router } from '@inertiajs/react';

export function useStudyClassIndex(classes, branches, instructors, filters) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [editingClass, setEditingClass] = useState(null);
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('admin.academic.study-classes.index'), 
            { ...filters, search }, 
            { preserveState: true }
        );
    };

    const handleFilterBranch = (branchId) => {
        router.get(route('admin.academic.study-classes.index'), 
            { ...filters, branch_id: branchId }, 
            { preserveState: true }
        );
    };

    const handleFilterType = (type) => {
        router.get(route('admin.academic.study-classes.index'), 
            { ...filters, type: type }, 
            { preserveState: true }
        );
    };

    const handleFilterCategory = (category) => {
        router.get(route('admin.academic.study-classes.index'), 
            { ...filters, category: category }, 
            { preserveState: true }
        );
    };

    const handleFilterStatus = (status) => {
        router.get(route('admin.academic.study-classes.index'), 
            { ...filters, status: status }, 
            { preserveState: true }
        );
    };

    const handleFilterSessionStatus = (sessionStatus) => {
        router.get(route('admin.academic.study-classes.index'), 
            { ...filters, session_status: sessionStatus }, 
            { preserveState: true }
        );
    };

    const handleToggleStatus = (studyClass) => {
        const isCurrentActive = (studyClass.status || 'active') === 'active';
        const newStatus = isCurrentActive ? 'inactive' : 'active';
        const actionMessage = isCurrentActive 
            ? `Apakah Anda yakin ingin MENONAKTIFKAN kelas "${studyClass.name}"?` 
            : `Apakah Anda yakin ingin MENGAKTIFKAN KEMBALI kelas "${studyClass.name}"?`;

        if (window.confirm(actionMessage)) {
            router.patch(route('admin.academic.study-classes.update', studyClass.id), {
                ...studyClass,
                status: newStatus,
            }, { preserveScroll: true });
        }
    };

    const openCreateModal = () => {
        setEditingClass(null);
        setIsModalOpen(true);
    };

    const openEditModal = (studyClass) => {
        setEditingClass(studyClass);
        setIsModalOpen(true);
    };

    const openStudentDrawer = (studyClass) => {
        setSelectedClass(studyClass);
        setIsDrawerOpen(true);
    };

    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resettingClass, setResettingClass] = useState(null);

    const handleResetCycle = (studyClass) => {
        setResettingClass(studyClass);
        setIsResetModalOpen(true);
    };

    const closeResetModal = () => {
        setResettingClass(null);
        setIsResetModalOpen(false);
    };

    const handleDelete = (studyClass) => {
        if (confirm(`Are you sure you want to delete class "${studyClass.name}"?`)) {
            router.delete(route('admin.academic.study-classes.destroy', studyClass.id));
        }
    };

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailClassId, setDetailClassId] = useState(null);

    const classList = classes.data || classes || [];
    const detailClass = detailClassId 
        ? (classList.find(c => c.id === detailClassId) || null) 
        : null;

    const openDetailModal = (studyClass) => {
        setDetailClassId(studyClass.id);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setDetailClassId(null);
        setIsDetailModalOpen(false);
    };

    const closeModal = () => setIsModalOpen(false);
    const closeDrawer = () => setIsDrawerOpen(false);

    return {
        // State
        isModalOpen,
        isDrawerOpen,
        isResetModalOpen,
        isDetailModalOpen,
        selectedClass,
        editingClass,
        resettingClass,
        detailClass,
        search,
        setSearch,
        
        // Actions
        handleSearch,
        handleFilterBranch,
        handleFilterType,
        handleFilterCategory,
        handleFilterStatus,
        handleFilterSessionStatus,
        handleToggleStatus,
        openCreateModal,
        openEditModal,
        openStudentDrawer,
        openDetailModal,
        handleResetCycle,
        handleDelete,
        closeModal,
        closeDrawer,
        closeResetModal,
        closeDetailModal,
    };
}
