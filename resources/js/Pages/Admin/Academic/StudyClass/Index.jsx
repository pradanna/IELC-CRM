import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { Plus, Search, Filter, BookOpen } from 'lucide-react';
import ClassCard from './partials/ClassCard';
import CreateEditClassModal from './modals/CreateEditClassModal';
import ResetCycleModal from './modals/ResetCycleModal';
import ClassStudentDrawer from './drawers/ClassStudentDrawer';
import PremiumSelect from '@/Components/PremiumSelect';
import TextInput from '@/Components/TextInput';
import { useStudyClassIndex } from './hooks/useStudyClassIndex';
import Pagination from '@/Components/ui/Pagination';

export default function Index({ classes, branches, instructors, priceMasters, leadTypes = [], filters }) {
    const {
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
        handleFilterCategory,
        handleFilterStatus,
        handleFilterSessionStatus,
        handleToggleStatus,
        openCreateModal,
        openEditModal,
        openStudentDrawer,
        handleResetCycle,
        handleDelete,
        closeModal,
        closeDrawer,
        closeResetModal
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
                            Showing {classes.data ? classes.data.length : (classes.length || 0)} {filters.status === 'inactive' ? 'inactive' : (filters.status === 'all' ? 'total' : 'active')} classes
                        </p>
                    </div>

                    <button 
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full shadow-lg shadow-red-600/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                        <span>Launch New Class</span>
                    </button>
                </div>

                {/* Filters & Actions Card */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3 relative z-20">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        <form onSubmit={handleSearch} className="relative w-full sm:w-48 xl:w-56 group">
                            <TextInput 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search class name..."
                                className="w-full !rounded-full !pl-10 !py-2.5 border-slate-200 focus:border-red-500 transition-all shadow-xs font-bold text-xs"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                        </form>

                        <div className="w-full sm:w-36 xl:w-44">
                            <PremiumSelect 
                                options={[
                                    { value: 'active', label: 'Kelas Aktif' },
                                    { value: 'inactive', label: 'Kelas Tidak Aktif' },
                                    { value: 'all', label: 'Semua Status' }
                                ]}
                                value={filters.status || 'active'}
                                onChange={handleFilterStatus}
                                icon={Filter}
                                placeholder="Status Kelas"
                            />
                        </div>

                        <div className="w-full sm:w-36 xl:w-44">
                            <PremiumSelect 
                                options={[
                                    { value: '', label: 'Semua Sesi' },
                                    { value: 'active_session', label: 'Belum Habis' },
                                    { value: 'expired', label: 'Habis Sesi' }
                                ]}
                                value={filters.session_status || ''}
                                onChange={handleFilterSessionStatus}
                                icon={Filter}
                                placeholder="Status Sesi"
                            />
                        </div>

                        <div className="w-full sm:w-36 xl:w-44">
                            <PremiumSelect 
                                options={[
                                    { value: '', label: 'All Branches' },
                                    ...branches.data.map(b => ({ value: b.id, label: b.name }))
                                ]}
                                value={filters.branch_id || ''}
                                onChange={handleFilterBranch}
                                icon={Filter}
                                placeholder="Filter Branch"
                            />
                        </div>

                        <div className="w-full sm:w-36 xl:w-44">
                            <PremiumSelect 
                                options={[
                                    { value: '', label: 'Semua Kategori' },
                                    { value: 'group', label: 'Group Class' },
                                    { value: 'private', label: 'Private Class' }
                                ]}
                                value={filters.category || ''}
                                onChange={handleFilterCategory}
                                icon={Filter}
                                placeholder="Kategori Kelas"
                            />
                        </div>

                        <div className="w-full sm:w-36 xl:w-44">
                            <PremiumSelect 
                                options={[
                                    { value: '', label: 'Semua Mode' },
                                    { value: 'offline', label: 'Offline' },
                                    { value: 'online', label: 'Online' }
                                ]}
                                value={filters.type || ''}
                                onChange={handleFilterType}
                                icon={Filter}
                                placeholder="Mode Kelas"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 italic shrink-0 ml-auto">
                        <BookOpen className="w-3.5 h-3.5 translate-y-[-1px]" />
                        <span>{classes.meta?.total || (classes.data ? classes.data.length : (classes.length || 0))} {filters.status === 'inactive' ? 'Inactive' : (filters.status === 'all' ? 'Total' : 'Active')} Tracks</span>
                    </div>
                </div>

                {/* Main Grid */}
                {(classes.data ? classes.data.length : classes.length) > 0 ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(classes.data || classes).map((c) => (
                                <ClassCard 
                                    key={c.id} 
                                    studyClass={c} 
                                    onEdit={openEditModal}
                                    onDelete={handleDelete}
                                    onResetCycle={handleResetCycle}
                                    onManageStudents={openStudentDrawer}
                                    onToggleStatus={handleToggleStatus}
                                />
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm gap-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Showing {classes.data?.length || 0} of {classes.meta?.total || 0} Classes
                            </span>
                            <Pagination links={classes.meta?.links || (Array.isArray(classes.links) ? classes.links : [])} />
                        </div>
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
                leadTypes={leadTypes}
            />

            <ClassStudentDrawer 
                isOpen={isDrawerOpen}
                onClose={closeDrawer}
                studyClass={selectedClass}
            />

            <ResetCycleModal 
                isOpen={isResetModalOpen}
                onClose={closeResetModal}
                studyClass={resettingClass}
            />
        </AdminLayout>
    );
}
