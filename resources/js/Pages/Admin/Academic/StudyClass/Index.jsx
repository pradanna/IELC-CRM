import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Plus, Search, Filter, BookOpen } from 'lucide-react';
import ClassCard from './partials/ClassCard';
import CreateEditClassModal from './modals/CreateEditClassModal';
import ClassStudentDrawer from './drawers/ClassStudentDrawer';
import PremiumSelect from '@/Components/PremiumSelect';
import TextInput from '@/Components/TextInput';
import { useStudyClassIndex } from './hooks/useStudyClassIndex';

export default function Index({ classes, branches, instructors, priceMasters, filters }) {
    const {
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
    } = useStudyClassIndex(classes, branches, instructors, filters);

    return (
        <AdminLayout>
            <Head title="Class Management" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-20">
                {/* Simple Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Study Class <span className="text-red-600">Management</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-0.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Showing {classes.length} active classes
                        </p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        className="group flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/10 active:scale-95"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        <span>LAUNCH NEW CLASS</span>
                    </button>
                </div>

                {/* Filters & Actions Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between relative z-20">
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                            <Plus size={14} className="text-red-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Controls</span>
                        </div>

                        <form onSubmit={handleSearch} className="relative w-full md:w-80 group">
                            <TextInput 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search class name..."
                                className="w-full !rounded-xl !pl-11 !py-3 border-slate-200 focus:border-red-500 transition-all shadow-sm font-bold text-sm"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                        </form>
                        
                        <div className="hidden md:block h-8 w-px bg-slate-200 mx-2" />

                        <div className="w-full md:w-64">
                            <PremiumSelect 
                                options={[
                                    { value: '', label: 'All Branches' },
                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                ]}
                                value={filters.branch_id || ''}
                                onChange={handleFilterBranch}
                                icon={Filter}
                                placeholder="Filter Branch"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 italic shrink-0">
                        <BookOpen className="w-3.5 h-3.5 translate-y-[-1px]" />
                        <span>{classes.length} Active Tracks</span>
                    </div>
                </div>

                {/* Main Grid */}
                {classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {classes.map((c) => (
                            <ClassCard 
                                key={c.id} 
                                studyClass={c} 
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                                onResetCycle={handleResetCycle}
                                onManageStudents={openStudentDrawer}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
                        <div className="p-8 bg-slate-50 rounded-full border-4 border-white shadow-xl shadow-slate-200/50">
                            <Plus className="w-12 h-12 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800">No classes found</h3>
                            <p className="text-slate-400 max-w-xs font-medium italic">Try adjusting your filters or create your first learning track now.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Drawers */}
            <CreateEditClassModal 
                isOpen={isModalOpen}
                onClose={closeModal}
                studyClass={editingClass}
                branches={branches}
                instructors={instructors}
                priceMasters={priceMasters}
            />

            <ClassStudentDrawer 
                isOpen={isDrawerOpen}
                onClose={closeDrawer}
                studyClass={selectedClass}
            />
        </AdminLayout>
    );
}
