import React, { useState, useEffect, useCallback } from 'react';
import { 
    X, UserPlus, Trash2, Search, 
    GraduationCap, Loader2, User, 
    ChevronRight, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

// Custom debounce implementation to avoid extra dependencies
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default function ClassStudentDrawer({ isOpen, onClose, studyClass }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [enrollingId, setEnrollingId] = useState(null);

    // Fetch search results
    const fetchStudents = useCallback(
        debounce(async (q) => {
            if (!q) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const res = await axios.get(route('admin.academic.students.search'), { params: { q } });
                setSearchResults(res.data.students);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        fetchStudents(searchQuery);
    }, [searchQuery]);

    const handleEnroll = (studentId) => {
        setEnrollingId(studentId);
        router.post(route('admin.academic.study-classes.enroll', studyClass.id), {
            student_id: studentId
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setEnrollingId(null);
                setSearchQuery('');
            }
        });
    };

    const handleUnenroll = (studentId) => {
        if (confirm('Remove this student from the class?')) {
            router.delete(route('admin.academic.study-classes.unenroll', [studyClass.id, studentId]), {
                preserveScroll: true,
            });
        }
    };

    if (!studyClass) return null;

    // Filter out already enrolled students from search results
    const filteredSearchResults = searchResults.filter(
        s => !studyClass.students?.some(enrolled => enrolled.id === s.id)
    );

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">{studyClass.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Student Management <span className="text-red-500">• Cycle #{studyClass.current_session_number}</span></p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Search Bar */}
                        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20">
                            <div className="relative group">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isSearching ? 'text-red-500 animate-pulse' : 'text-slate-400 group-focus-within:text-red-500'}`} />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or student ID..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/5 rounded-xl transition-all font-bold text-sm placeholder:text-slate-400"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Search Results Popover */}
                            {searchQuery && (
                                <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-slate-100 shadow-xl bg-white divide-y divide-slate-50">
                                    {filteredSearchResults.length > 0 ? filteredSearchResults.map(student => (
                                        <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs">
                                                    {student.student_number.split('-').pop()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{student.lead?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{student.student_number}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleEnroll(student.id)}
                                                disabled={enrollingId === student.id}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
                                            >
                                                {enrollingId === student.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    )) : !isSearching && (
                                        <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase italic">
                                            No matching students found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Current Students List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Students ({studyClass.students?.length || 0})</h4>
                                <div className="h-px flex-1 bg-slate-50 mx-4" />
                            </div>

                            <div className="space-y-3">
                                {studyClass.students?.length > 0 ? studyClass.students.map((student) => (
                                    <div key={student.id} className="group p-4 bg-white border border-slate-100 rounded-xl hover:border-red-100 hover:shadow-lg hover:shadow-slate-100/50 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                                                    <User className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-black text-slate-900">{student.lead?.name || 'Unknown Student'}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono text-slate-400">#{student.student_number}</span>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                        <span className="text-[10px] font-black text-emerald-600 uppercase">Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleUnenroll(student.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-full">
                                            <AlertCircle className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-slate-400 tracking-widest uppercase">Class is Empty</p>
                                            <p className="text-[10px] font-medium text-slate-300 px-10 leading-relaxed italic">Search students above to enroll them into this learning track.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                        <button 
                            onClick={onClose}
                            className="w-full py-2.5 bg-white hover:bg-slate-900 text-slate-900 hover:text-white border border-slate-200 hover:border-slate-900 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                        >
                            Close Drawer
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
