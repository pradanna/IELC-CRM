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

    const handleResetCycle = (studyClass) => {
        if (confirm(`Finalize Cycle #${studyClass.current_session_number} for "${studyClass.name}" and start a new one? Current students will be carried over.`)) {
            router.post(route('admin.academic.study-classes.reset-cycle', studyClass.id), {}, {
                preserveScroll: true,
            });
        }
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
        selectedClass,
        editingClass,
        search,
        setSearch,
        
        // Actions
        handleSearch,
        handleFilterBranch,
        openCreateModal,
        openEditModal,
        openStudentDrawer,
        handleResetCycle,
        handleDelete,
        closeModal,
        closeDrawer
    };
}
