import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { 
    User, Phone, Mail, BookOpen, Clock, 
    ChevronRight, GraduationCap, Search, 
    Filter, MoreHorizontal, UserCheck, 
    Calendar, MapPin 
} from 'lucide-react';
import TextInput from '@/Components/TextInput';

export default function Index({ students, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.academic.students.index'), { search }, { preserveState: true });
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
                </div>

                {/* Filters & Actions Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between relative z-20">
                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                            <Filter size={14} className="text-red-500" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filters</span>
                        </div>

                        <form onSubmit={handleSearch} className="relative group w-full md:w-80">
                            <TextInput 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search students by name, ID..."
                                className="w-full !rounded-xl !pl-11 !py-3 border-slate-200 focus:border-red-500 transition-all shadow-sm font-bold text-sm"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                        </form>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 italic shrink-0">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{students.length} Registered Students</span>
                    </div>
                </div>

                {/* Main List */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Student Profile</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 uppercase">Contact & Branch</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 uppercase">Active Classes</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 uppercase">Enrollment</th>
                                    <th className="px-8 py-5 text-center border-b border-slate-100 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {students.length > 0 ? students.map((student) => (
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
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                                                        <UserCheck className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-black text-slate-800 text-lg leading-none">
                                                        {student.lead?.name || 'Unknown Student'}
                                                    </h4>
                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded">
                                                        {student.student_number}
                                                    </span>
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
                                            <div className="flex flex-wrap gap-2">
                                                {student.study_classes?.slice(0, 2).map(cls => (
                                                    <span key={cls.id} className="px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-xl border border-red-100 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                                                        {cls.name}
                                                    </span>
                                                ))}
                                                {student.study_classes?.length > 2 && (
                                                    <span className="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100">
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
                                                    {new Date(student.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-center">
                                            <button className="p-2.5 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl transition-all duration-300 group/btn shadow-sm">
                                                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                            </button>
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
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Placeholder */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {students.length} Total Registered Students
                        </span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
