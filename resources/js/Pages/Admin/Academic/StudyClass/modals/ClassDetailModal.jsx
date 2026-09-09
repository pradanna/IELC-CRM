import React, { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import { 
    GraduationCap, Users, Calendar, MapPin, 
    User, Clock, Tag, X, CheckCircle2, 
    AlertCircle, Phone, Plus, Trash2, BookOpen, 
    Layers, Check, Sparkles, AlertTriangle, Edit3, Save,
    Loader2
} from 'lucide-react';
import { router, useForm } from '@inertiajs/react';

export default function ClassDetailModal({ isOpen, onClose, studyClass }) {
    if (!studyClass) return null;

    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attendances'
    const [isAddingAttendance, setIsAddingAttendance] = useState(false);
    const [isEditingProgress, setIsEditingProgress] = useState(false);
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [isSavingManual, setIsSavingManual] = useState(false);

    // Local reactive state for instant optimistic updates
    const [currentSessionProgress, setCurrentSessionProgress] = useState(studyClass.session_progress ?? 0);
    const [manualProgressInput, setManualProgressInput] = useState(studyClass.session_progress ?? 0);
    const [localAttendances, setLocalAttendances] = useState(studyClass.attendances || []);

    useEffect(() => {
        if (studyClass) {
            setCurrentSessionProgress(studyClass.session_progress ?? 0);
            setManualProgressInput(studyClass.session_progress ?? 0);
            setLocalAttendances(studyClass.attendances || []);
        }
    }, [studyClass]);

    const totalMeetings = studyClass.total_meetings || 1;
    const progress = Math.min(100, Math.round((currentSessionProgress / totalMeetings) * 100));
    const isActive = (studyClass.status || 'active') === 'active';
    const students = studyClass.students || [];
    const isPrivate = studyClass.is_private;

    const currentCycle = studyClass.current_session_number || 1;
    const nextSessionNum = localAttendances.length + 1;

    // Form for quick session attendance logging
    const { data, setData, post, processing, reset, errors } = useForm({
        attendance_date: new Date().toISOString().split('T')[0],
        session_number: nextSessionNum,
        status: 'present',
        student_id: students.length > 0 ? students[0].id : '',
        topic: '',
        notes: '',
    });

    useEffect(() => {
        setData('session_number', localAttendances.length + 1);
    }, [localAttendances.length]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const handleRecordAttendance = (e) => {
        e.preventDefault();
        post(route('admin.academic.study-classes.attendances.store', studyClass.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddingAttendance(false);
                reset();
            }
        });
    };

    const handleDeleteAttendance = (attendanceId, sessionNumber) => {
        if (confirm(`Hapus catatan kehadiran sesi ke-${sessionNumber}?`)) {
            router.delete(route('admin.academic.study-classes.attendances.destroy', [studyClass.id, attendanceId]), {
                preserveScroll: true,
            });
        }
    };

    const handleQuickAddOne = () => {
        setIsQuickAdding(true);
        // Optimistic UI bump
        setCurrentSessionProgress(prev => Math.min(totalMeetings, prev + 1));
        
        router.post(route('admin.academic.study-classes.attendances.store', studyClass.id), {
            attendance_date: new Date().toISOString().split('T')[0],
            session_number: localAttendances.length + 1,
            status: 'present',
            student_id: students.length > 0 ? students[0].id : null,
            topic: `Sesi ke-${localAttendances.length + 1}`,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsQuickAdding(false);
            }
        });
    };

    const handleSaveManualProgress = (e) => {
        e.preventDefault();
        const targetVal = parseInt(manualProgressInput, 10);
        setIsSavingManual(true);
        // Optimistic update
        setCurrentSessionProgress(targetVal);

        router.patch(route('admin.academic.study-classes.update-progress', studyClass.id), {
            session_progress: targetVal,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditingProgress(false);
            },
            onFinish: () => {
                setIsSavingManual(false);
            }
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="4xl">
            <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl">
                {/* Modal Header */}
                <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative flex justify-between items-start gap-4">
                        <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-1 bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                                    Cycle #{currentCycle}
                                </span>
                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                                    isActive 
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                        : 'bg-slate-700/50 text-slate-400 border-slate-600'
                                }`}>
                                    {isActive ? 'Active Class' : 'Inactive'}
                                </span>
                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                                    isPrivate
                                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                }`}>
                                    {isPrivate ? 'Non-Group / Private' : 'Group Class'}
                                </span>
                                <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                    {studyClass.type || 'offline'}
                                </span>
                            </div>

                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                                    {studyClass.name}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                                    <span>{studyClass.branch?.name || 'Central Campus'}</span>
                                    {studyClass.instructor_name && (
                                        <>
                                            <span className="text-slate-600">•</span>
                                            <User className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Instructor: {studyClass.instructor_name}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose} 
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Tabs in Modal Header */}
                    <div className="flex gap-6 mt-6 border-b border-slate-700/60 pt-2">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === 'overview'
                                    ? 'border-red-500 text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Ringkasan & Siswa</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('attendances')}
                            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === 'attendances'
                                    ? 'border-red-500 text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Log Sesi / Kehadiran</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700 text-amber-300 font-bold">
                                {studyClass.session_progress}/{studyClass.total_meetings}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-emerald-500" /> Total Siswa
                            </span>
                            <p className="text-xl font-black text-slate-900">{students.length} Siswa</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Kuota Sesi
                            </span>
                            <p className="text-xl font-black text-slate-900">{studyClass.total_meetings || 0} Pertemuan</p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-amber-500" /> Master Paket
                            </span>
                            <p className="text-xs font-black text-slate-800 truncate" title={studyClass.price_master?.name || '-'}>
                                {studyClass.price_master?.name || '-'}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-600">
                                {studyClass.price_master ? formatCurrency(studyClass.price_master.price_per_session) : '-'}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-red-500" /> Sisa Sesi
                            </span>
                            <p className={`text-xl font-black ${
                                (studyClass.total_meetings - currentSessionProgress) <= 2
                                    ? 'text-red-600'
                                    : 'text-emerald-600'
                            }`}>
                                {Math.max(0, (studyClass.total_meetings || 0) - currentSessionProgress)} Sesi
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar Card */}
                    <div className={`p-5 rounded-2xl border space-y-4 ${
                        isPrivate
                            ? 'bg-amber-50/50 border-amber-200/70'
                            : 'bg-slate-50 border-slate-200/70'
                    }`}>
                        <div className="flex flex-wrap justify-between items-center gap-3">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                    {isPrivate ? (
                                        <>
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <span>Progress Kuota Kedatangan / Kehadiran Sesi</span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-4 h-4 text-red-600" />
                                            <span>Progress Periode Siklus Kelas</span>
                                        </>
                                    )}
                                </h4>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                    {isPrivate 
                                        ? `Tercatat ${currentSessionProgress} dari total ${studyClass.total_meetings} sesi pertemuan.`
                                        : `Periode: ${studyClass.start_session_date ? new Date(studyClass.start_session_date).toLocaleDateString('id-ID') : '-'} s/d ${studyClass.end_session_date ? new Date(studyClass.end_session_date).toLocaleDateString('id-ID') : '-'}`
                                    }
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {isPrivate && !isEditingProgress && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setManualProgressInput(currentSessionProgress);
                                                setIsEditingProgress(true);
                                            }}
                                            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
                                            title="Ubah Angka Progress Manual"
                                        >
                                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Set Manual</span>
                                        </button>
                                        <button
                                            onClick={handleQuickAddOne}
                                            disabled={isQuickAdding}
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                            title="Quick 1 Sesi Hari Ini"
                                        >
                                            {isQuickAdding ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Plus className="w-3.5 h-3.5" />
                                            )}
                                            <span>{isQuickAdding ? 'Menambah...' : '1 Sesi Cepat'}</span>
                                        </button>
                                    </>
                                )}

                                <span className="text-sm font-black text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                                    {currentSessionProgress} <span className="text-slate-400">/ {studyClass.total_meetings}</span> ({progress}%)
                                </span>
                            </div>
                        </div>

                        {/* Inline Edit Form for Manual Progress */}
                        {isEditingProgress && (
                            <form onSubmit={handleSaveManualProgress} className="p-3.5 bg-white rounded-xl border border-amber-300 shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                                <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">
                                        Input Sesi Selesai:
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <input 
                                            type="number"
                                            min="0"
                                            max={studyClass.total_meetings || 100}
                                            value={manualProgressInput}
                                            onChange={(e) => setManualProgressInput(e.target.value)}
                                            className="w-20 text-center font-black text-sm rounded-lg border-slate-300 focus:border-amber-500 focus:ring-amber-500 py-1"
                                            required
                                        />
                                        <span className="text-xs font-bold text-slate-400">/ {studyClass.total_meetings} Sesi</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={isSavingManual}
                                        onClick={() => setIsEditingProgress(false)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingManual}
                                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        {isSavingManual ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Save className="w-3.5 h-3.5" />
                                        )}
                                        <span>{isSavingManual ? 'Menyimpan...' : 'Simpan Progress'}</span>
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="h-2.5 w-full bg-white rounded-full overflow-hidden border border-slate-200">
                            <div 
                                className={`h-full transition-all duration-700 rounded-full ${
                                    isPrivate 
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                                        : 'bg-red-600'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* TAB CONTENT: Overview (Student List) */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <Users className="w-4 h-4 text-red-600" />
                                        Daftar Siswa Terdaftar ({students.length})
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Data siswa yang sedang aktif mengikuti kelas ini
                                    </p>
                                </div>
                            </div>

                            {students.length > 0 ? (
                                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                                    {students.map((student, idx) => {
                                        const lead = student.lead;
                                        return (
                                            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-600 text-xs shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                                                            <span>{lead?.name || 'Nama Siswa'}</span>
                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-200">
                                                                {student.status || 'Active'}
                                                            </span>
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
                                                            <span className="font-mono text-slate-600 font-bold">{student.student_number || '-'}</span>
                                                            {lead?.phone && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                                        {lead.phone}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {lead?.school && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{lead.school} {lead.grade ? `(${lead.grade})` : ''}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Tanggal Join</span>
                                                    <span className="text-xs font-black text-slate-700">
                                                        {student.start_join ? new Date(student.start_join).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (student.enrolled_at || '-')}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="p-3 bg-white rounded-full shadow-xs">
                                        <AlertCircle className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Belum Ada Siswa</p>
                                        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                                            Kelas ini belum memiliki siswa yang terdaftar.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: Attendances / Session Log */}
                    {activeTab === 'attendances' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap justify-between items-center gap-3">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-amber-500" />
                                        Log Riwayat Kedatangan Sesi ({localAttendances.length})
                                    </h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Pencatatan tanggal dan topik pertemuan sesi kelas
                                    </p>
                                </div>

                                <button
                                    onClick={() => {
                                        setData('session_number', localAttendances.length + 1);
                                        setIsAddingAttendance(!isAddingAttendance);
                                    }}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isAddingAttendance ? 'Batal' : 'Catat Sesi Manual'}</span>
                                </button>
                            </div>

                            {/* Form Input Sesi Baru */}
                            {isAddingAttendance && (
                                <form onSubmit={handleRecordAttendance} className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-amber-600" />
                                            Input Data Sesi Baru (Sesi ke-{data.session_number})
                                        </h4>
                                        <span className="text-[10px] font-bold text-amber-700 uppercase">Cycle #{currentCycle}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Tanggal Sesi</label>
                                            <input 
                                                type="date"
                                                value={data.attendance_date}
                                                onChange={(e) => setData('attendance_date', e.target.value)}
                                                className="w-full text-xs font-bold rounded-xl border-slate-200 focus:border-amber-500 focus:ring-amber-500 py-2"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Status Kehadiran</label>
                                            <select
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                                className="w-full text-xs font-bold rounded-xl border-slate-200 focus:border-amber-500 focus:ring-amber-500 py-2"
                                            >
                                                <option value="present">Hadir (Present)</option>
                                                <option value="permission">Izin (Permission)</option>
                                                <option value="sick">Sakit (Sick)</option>
                                                <option value="absent">Alpha / Hangus (Absent)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-600 block mb-1">Topik / Materi (Opsional)</label>
                                            <input 
                                                type="text"
                                                value={data.topic}
                                                onChange={(e) => setData('topic', e.target.value)}
                                                placeholder="e.g. Speaking Practice Part 2"
                                                className="w-full text-xs font-medium rounded-xl border-slate-200 focus:border-amber-500 focus:ring-amber-500 py-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-amber-200/50">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingAttendance(false)}
                                            className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all disabled:opacity-50"
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Kehadiran'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Table of Attendances */}
                            {localAttendances.length > 0 ? (
                                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                                            <tr>
                                                <th className="py-3 px-4">Sesi</th>
                                                <th className="py-3 px-4">Tanggal</th>
                                                <th className="py-3 px-4">Topik / Materi</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">Dicatat Oleh</th>
                                                <th className="py-3 px-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {localAttendances.map((att) => (
                                                <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3 px-4 font-black text-slate-900">
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-mono">
                                                            #{att.session_number}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-slate-700">
                                                        {att.attendance_date ? new Date(att.attendance_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600 font-medium">
                                                        {att.topic || <span className="text-slate-300 italic">-</span>}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${
                                                            att.status === 'present'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : att.status === 'permission'
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                        }`}>
                                                            {att.status === 'present' ? 'Hadir' : (att.status === 'permission' ? 'Izin' : att.status)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                                                        {att.recorder_name || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteAttendance(att.id, att.session_number)}
                                                            className="p-1 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Hapus Catatan Sesi"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                                    <div className="p-3 bg-white rounded-full shadow-xs">
                                        <Calendar className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Belum Ada Sesi Dicatat</p>
                                        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                                            Gunakan tombol "+1 Sesi Cepat" atau "+ Catat Sesi Manual" di atas saat siswa hadir mengikuti pertemuan.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 italic">
                        {isPrivate ? 'Tracking Kedatangan Fleksibel (Non-Group)' : 'Siklus Kalender Otomatis (Group)'}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm"
                    >
                        Tutup Detail
                    </button>
                </div>
            </div>
        </Modal>
    );
}
