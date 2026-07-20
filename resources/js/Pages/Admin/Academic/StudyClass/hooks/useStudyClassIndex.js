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

    const closeModal = () => setIsModalOpen(false);
    const closeDrawer = () => setIsDrawerOpen(false);

    return {
        // State
        isModalOpen,
        isDrawerOpen,
        isResetModalOpen,
        selectedClass,
        editingClass,
        resettingClass,
        search,
        setSearch,
        
        // Actions
        handleSearch,
        handleFilterBranch,
        handleFilterType,
        openCreateModal,
        openEditModal,
        openStudentDrawer,
        handleResetCycle,
        handleDelete,
        closeModal,
        closeDrawer,
        closeResetModal
    };
}
