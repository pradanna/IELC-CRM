import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    User, Users, Phone, GraduationCap, Search, 
    Filter, UserCheck, ShieldAlert, Clock,
    Calendar, MapPin, ChevronRight, Package, Award, Edit3,
    ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, AlertTriangle
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import PremiumSelect from '@/Components/PremiumSelect';
import TableActionDropdown from '@/Components/ui/TableActionDropdown';
import { useStudentIndex } from './hooks/useStudentIndex';
import EditStudentModal from './partials/EditStudentModal';
import StudentDetailModal from './partials/StudentDetailModal';
import BulkPromoteModal from './modals/BulkPromoteModal';
import { AcademicDashboardContent } from '../Dashboard';
import Pagination from '@/Components/ui/Pagination';
import ExportButtons from '@/Components/ui/ExportButtons';

export default function Index({ students, studyClassesList = [], priceMastersList = [], gradesList = [], filters, reports }) {
    const { 
        search, 
        setSearch, 
        handleSearch, 
        handleFilterExpiry, 
        handleFilterStatus, 
        handleFilterCategory,
        handleFilterClass,
        handleFilterPriceMaster,
        handleFilterGrade,
        handleSort 
    } = useStudentIndex(filters);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isBulkPromoteModalOpen, setIsBulkPromoteModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [defaultEditStatus, setDefaultEditStatus] = useState(null);

    const urlParams = new URLSearchParams(window.location.search);
    const [activeMainTab, setActiveMainTab] = useState(urlParams.get('mainTab') || 'list');

    const handleDashboardFilterChange = (newFilters) => {
        const params = {
            ...newFilters,
            mainTab: 'analytics',
            search: search || '',
        };
        router.get('/admin/academic/students', params, { preserveState: true, preserveScroll: true });
    };

    const buildListExportUrl = (format) => {
        const base = format === 'excel'
            ? '/admin/academic/students/export/excel'
            : '/admin/academic/students/export/pdf';
        const activeParams = Object.fromEntries(
            Object.entries({ ...filters, search }).filter(([, v]) => v !== null && v !== undefined && v !== '')
        );
        const params = new URLSearchParams({ ...activeParams, tab: 'list' });
        return `${base}?${params.toString()}`;
    };

    const openEditModal = (student, defaultStatus = null) => {
        setSelectedStudent(student);
        setDefaultEditStatus(defaultStatus);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setSelectedStudent(null);
        setDefaultEditStatus(null);
        setIsEditModalOpen(false);
    };

    const openDetailModal = (student) => {
        setSelectedStudent(student);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setSelectedStudent(null);
        setIsDetailModalOpen(false);
    };

    const renderSortHeader = (label, field) => {
        const isSorted = filters.sort_field === field;
        const isAsc = filters.sort_direction === 'asc';
        
        return (
            <button 
                type="button"
                onClick={() => handleSort(field)}
                className="flex items-center gap-1.5 hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-[10px] font-black text-left"
            >
                <span>{label}</span>
                {isSorted ? (
                    isAsc ? <ArrowUp size={12} className="text-red-500" /> : <ArrowDown size={12} className="text-red-500" />
                ) : (
                    <ArrowUpDown size={12} className="text-slate-300 group-hover:text-slate-455" />
                )}
            </button>
        );
    };

    return (
        <AdminLayout>
            <Head title="Student Management" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-20">
                {/* Simple Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Student <span className="text-red-600">Database</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-0.5">
                            <GraduationCap className="w-3.5 h-3.5 text-red-500" />
                            Active Enrolled Learners
                        </p>
                    </div>

                    {/* Tabs switcher */}
                    <div className="flex items-center gap-1 bg-slate-100/85 p-1 rounded-xl w-fit border border-slate-200/50 backdrop-blur-md">
                        <button
                            onClick={() => {
                                setActiveMainTab('list');
                                router.get('/admin/academic/students', { mainTab: 'list' }, { preserveState: true });
                            }}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                                activeMainTab === 'list' 
                                    ? 'bg-slate-900 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Database Siswa
                        </button>
                        <button
                            onClick={() => {
                                setActiveMainTab('analytics');
                                router.get('/admin/academic/students', { mainTab: 'analytics' }, { preserveState: true });
                            }}
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                                activeMainTab === 'analytics' 
                                    ? 'bg-slate-900 text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Statistik &amp; Analisis
                        </button>
                    </div>
                </div>

                {activeMainTab === 'list' ? (
                    <>
                        {/* Filters Card */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-wrap items-center gap-3 relative z-20">
                            <div className="flex flex-wrap items-center gap-2.5 flex-1">
                                <form onSubmit={handleSearch} className="relative group w-full sm:w-48 xl:w-56">
                                    <TextInput 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search students by name, ID..."
                                        className="w-full !rounded-full !pl-10 !py-2.5 border-slate-200 focus:border-red-500 transition-all shadow-xs font-bold text-xs"
                                    />
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                                </form>

                                <div className="w-full sm:w-36 xl:w-44">
                                    <PremiumSelect
                                        options={[
                                            { value: '', label: 'Semua Kategori' },
                                            { value: 'group', label: 'Group Class' },
                                            { value: 'private', label: 'Private Class' }
                                        ]}
                                        value={filters.class_category || ''}
                                        onChange={handleFilterCategory}
                                        icon={Users}
                                        placeholder="Kategori Kelas"
                                    />
                                </div>

                                <div className="w-full sm:w-36 xl:w-44">
                                    <PremiumSelect
                                        options={[
                                            { value: '', label: 'Semua Kelas' },
                                            ...studyClassesList.map(c => ({ value: c.id, label: c.name }))
                                        ]}
                                        value={filters.study_class_id || ''}
                                        onChange={handleFilterClass}
                                        icon={GraduationCap}
                                        placeholder="Filter Kelas"
                                    />
                                </div>

                                <div className="w-full sm:w-36 xl:w-44">
                                    <PremiumSelect
                                        options={[
                                            { value: '', label: 'Master Harga' },
                                            ...priceMastersList.map(p => ({ value: p.id, label: p.name }))
                                        ]}
                                        value={filters.price_master_id || ''}
                                        onChange={handleFilterPriceMaster}
                                        icon={Package}
                                        placeholder="Master Harga"
                                    />
                                </div>

                                <div className="w-full sm:w-36 xl:w-44">
                                    <PremiumSelect
                                        options={[
                                            { value: '', label: 'Semua Tingkat' },
                                            ...gradesList.map(g => ({ value: g, label: g }))
                                        ]}
                                        value={filters.grade || ''}
                                        onChange={handleFilterGrade}
                                        icon={Award}
                                        placeholder="Tingkat Sekolah"
                                    />
                                </div>

                                <div className="w-full sm:w-36 xl:w-44">
                                    <PremiumSelect
                                        options={[
                                            { value: '', label: 'Semua Masa Aktif' },
                                            { value: 'not_expired', label: 'Belum Habis (Aktif)' },
                                            { value: 'expiring_soon', label: 'Hampir Habis (≤ 21 Hari)' },
                                            { value: 'expired', label: 'Sudah Habis' }
                                        ]}
                                        value={filters.expiry_status || ''}
                                        onChange={handleFilterExpiry}
                                        icon={Clock}
                                        placeholder="Filter Masa Aktif"
                                    />
                                </div>

                                <div className="w-full sm:w-36 xl:w-44">
                                    <PremiumSelect
                                        options={[
                                            { value: '', label: 'Semua Status Siswa' },
                                            { value: 'active', label: 'Aktif' },
                                            { value: 'stop', label: 'Stopped (Berhenti)' }
                                        ]}
                                        value={filters.status || ''}
                                        onChange={handleFilterStatus}
                                        icon={UserCheck}
                                        placeholder="Filter Status"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Export + Bulk Promote + student count */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 italic">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{students.meta?.total || (students.data ? students.data.length : students.length)} Registered Students</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkPromoteModalOpen(true)}
                                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-extrabold text-xs tracking-wider shadow-sm flex items-center gap-2 transition-all hover:shadow-md active:scale-95"
                                >
                                    <AlertTriangle size={15} />
                                    <span>KENAIKAN KELAS</span>
                                </button>

                                <ExportButtons
                                    onPdf={buildListExportUrl('pdf')}
                                    onExcel={buildListExportUrl('excel')}
                                    label="Daftar Siswa"
                                    size="sm"
                                />
                            </div>
                        </div>

                {/* Main List */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 border-b border-slate-100">
                                        {renderSortHeader('Student Profile', 'name')}
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 uppercase">Contact & Branch</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 uppercase">Active Classes</th>
                                    <th className="px-8 py-5 border-b border-slate-100">
                                        {renderSortHeader('Enrollment', 'start_join')}
                                    </th>
                                    <th className="px-8 py-5 text-center border-b border-slate-100 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {students.data ? (
                                    students.data.length > 0 ? students.data.map((student) => (
                                        <tr key={student.id} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                                            {student.profile_picture ? (
                                                                <img src={student.profile_picture} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <User className="w-7 h-7 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full flex items-center justify-center ${
                                                            student.status === 'stop' ? 'bg-rose-500' : 'bg-emerald-500'
                                                        }`}>
                                                            {student.status === 'stop' ? (
                                                                <ShieldAlert className="w-2.5 h-2.5 text-white" />
                                                            ) : (
                                                                <UserCheck className="w-2.5 h-2.5 text-white" />
                                                            )}
                                                        </div>
                                                    </div>
                                                     <div className="space-y-1.5">
                                                         <h4 className="font-black text-slate-800 text-lg leading-none">
                                                             {student.lead?.name || 'Unknown Student'}
                                                         </h4>
                                                         <div className="flex items-center gap-2">
                                                             <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded">
                                                                 {student.student_number}
                                                             </span>
                                                             <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                                                 student.status === 'stop' 
                                                                     ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                                                     : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                             }`}>
                                                                 {student.status}
                                                             </span>
                                                         </div>
                                                         
                                                         {/* Loyalty Card & Packages Purchased Badge */}
                                                         <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                                                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/50 flex items-center gap-1 shadow-sm">
                                                                 <Package size={10} className="text-slate-400 shrink-0" />
                                                                 {student.rejoin_count || 0} Paket
                                                             </span>
                                                             {student.loyalty_tier && (
                                                                 <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-sm ${
                                                                     student.loyalty_tier.toLowerCase() === 'silver' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                                                     student.loyalty_tier.toLowerCase() === 'gold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                     student.loyalty_tier.toLowerCase() === 'platinum' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                     'bg-red-50 text-red-700 border-red-200'
                                                                 }`}>
                                                                     <Award size={10} className="shrink-0" />
                                                                     {student.loyalty_tier}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-slate-500">
                                                        <Phone className="w-3.5 h-3.5 text-slate-300" />
                                                        <span className="text-xs font-bold">{student.lead?.phone || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded flex items-center gap-1.5 shadow-sm border border-slate-200">
                                                            <MapPin className="w-3 h-3 text-slate-400" />
                                                            {student.lead?.branch?.name || 'Central'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-3">
                                                    {student.study_classes?.slice(0, 2).map(cls => {
                                                        const warning = (() => {
                                                            if (!cls.end_session_date) return null;
                                                            const end = new Date(cls.end_session_date);
                                                            const today = new Date();
                                                            end.setHours(0,0,0,0);
                                                            today.setHours(0,0,0,0);
                                                            const diffTime = end - today;
                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                            
                                                            if (diffDays < 0) {
                                                                return {
                                                                    text: `Habis (${Math.abs(diffDays)} hari lalu)`,
                                                                    class: 'bg-rose-50 text-rose-700 border-rose-100'
                                                                };
                                                            } else if (diffDays <= 21) {
                                                                return {
                                                                    text: `Hampir Habis (${diffDays} hari lagi)`,
                                                                    class: 'bg-amber-50 text-amber-700 border-amber-100'
                                                                };
                                                            }
                                                            return null;
                                                        })();

                                                        return (
                                                            <div key={cls.id} className="flex flex-col gap-1.5">
                                                                <span className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-xl border border-red-100 flex items-center gap-2 w-fit">
                                                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                                                                    {cls.name}
                                                                </span>
                                                                {warning && (
                                                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border ${warning.class} w-fit`}>
                                                                        {warning.text}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {student.study_classes?.length > 2 && (
                                                        <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100 align-self-start">
                                                            +{student.study_classes.length - 2} More
                                                        </span>
                                                    )}
                                                    {(!student.study_classes || student.study_classes.length === 0) && (
                                                        <span className="text-[10px] font-bold text-slate-300 italic uppercase">Not Enrolled</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-8">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-700">Joined Date</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 ml-6">
                                                        {student.start_join ? new Date(student.start_join).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (student.enrolled_at || '-')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end">
                                                    <TableActionDropdown>
                                                        <TableActionDropdown.Item 
                                                            icon={User} 
                                                            onClick={() => openDetailModal(student)}
                                                        >
                                                            Lihat Detail
                                                        </TableActionDropdown.Item>
                                                        <TableActionDropdown.Item 
                                                            icon={Edit3} 
                                                            onClick={() => openEditModal(student)}
                                                        >
                                                            Edit Status / Tanggal
                                                        </TableActionDropdown.Item>
                                                        <TableActionDropdown.Item 
                                                            icon={ShieldAlert} 
                                                            onClick={() => openEditModal(student, 'stop')}
                                                            variant="danger"
                                                        >
                                                            Stop Siswa
                                                        </TableActionDropdown.Item>
                                                    </TableActionDropdown>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-6 bg-slate-50 rounded-full">
                                                        <GraduationCap className="w-12 h-12 text-slate-200" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-xl font-black text-slate-800">No students found</h3>
                                                        <p className="text-sm font-medium text-slate-400">Try searching for a name or student number.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                            Showing {students.data?.length || 0} of {students.meta?.total || 0} Registered Students
                        </span>
                        <Pagination links={students.meta?.links || (Array.isArray(students.links) ? students.links : [])} />
                    </div>
                </div>
                    </>
                ) : (
                    <AcademicDashboardContent 
                        reports={reports} 
                        filters={filters} 
                        onFilterChange={handleDashboardFilterChange} 
                        hideHeader={true} 
                    />
                )}
            </div>

            {/* Edit Student Modal */}
            {selectedStudent && (
                <EditStudentModal 
                    show={isEditModalOpen} 
                    onClose={closeEditModal} 
                    student={selectedStudent} 
                    defaultStatus={defaultEditStatus}
                />
            )}

            {/* Student Detail Modal */}
            {selectedStudent && (
                <StudentDetailModal
                    show={isDetailModalOpen}
                    onClose={closeDetailModal}
                    student={selectedStudent}
                />
            )}
            {/* Bulk Promote Modal */}
            <BulkPromoteModal
                isOpen={isBulkPromoteModalOpen}
                onClose={() => setIsBulkPromoteModalOpen(false)}
                gradesList={gradesList}
            />
        </AdminLayout>
    );
}
