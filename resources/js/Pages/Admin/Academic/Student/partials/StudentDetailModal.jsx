import React, { Fragment, useState } from 'react';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { useForm, router } from '@inertiajs/react';
import { 
    X, 
    User, 
    Phone, 
    Mail, 
    MapPin, 
    Calendar, 
    BookOpen, 
    Award, 
    FileText, 
    School, 
    UserCheck, 
    ShieldAlert, 
    Clock, 
    Globe, 
    Building, 
    HeartHandshake, 
    Tag,
    Layers,
    CheckCircle2,
    AlertTriangle,
    History,
    FileSpreadsheet,
    Plus,
    Trash2,
    ExternalLink,
    FileCode,
    FileCheck,
    UploadCloud,
    Loader2,
    Camera,
    Pencil,
    Maximize2,
    ArrowRightLeft
} from 'lucide-react';
import Button from '@/Components/ui/Button';

function StudentProfilePhoto({ student, lead }) {
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [currentPhoto, setCurrentPhoto] = useState(student.profile_picture_url || student.profile_picture || null);
    const [showLightBox, setShowLightBox] = useState(false);
    const fileInputRef = React.useRef(null);

    const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.82) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Gagal mengompresi gambar'));
                                return;
                            }
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        },
                        'image/webp',
                        quality
                    );
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handlePhotoChange = async (e) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        setIsUploadingPhoto(true);
        try {
            const compressedFile = await compressImage(rawFile, 600, 600, 0.82);
            const formData = new FormData();
            formData.append('profile_picture', compressedFile);

            const res = await axios.post(route('admin.academic.students.upload-photo', student.id), formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newUrl = res.data.profile_picture_url;
            setCurrentPhoto(newUrl);
            student.profile_picture_url = newUrl;
            student.profile_picture = res.data.profile_picture;
        } catch (err) {
            alert('Gagal mengunggah foto: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    return (
        <div className="relative group shrink-0">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
            />
            
            <div
                onClick={() => {
                    if (currentPhoto) {
                        setShowLightBox(true);
                    } else {
                        fileInputRef.current?.click();
                    }
                }}
                title={currentPhoto ? "Klik untuk melihat foto" : "Klik untuk unggah foto"}
                className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner overflow-hidden relative group/avatar cursor-pointer hover:border-white/40 transition-all"
            >
                {isUploadingPhoto ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                ) : currentPhoto ? (
                    <>
                        <img src={currentPhoto} alt="" className="w-full h-full object-cover rounded-2xl" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                            <Maximize2 size={16} className="text-white" />
                        </div>
                    </>
                ) : (
                    <User size={30} className="text-red-400 group-hover/avatar:scale-90 transition-transform" />
                )}
            </div>

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                }}
                disabled={isUploadingPhoto}
                title="Unggah / Ganti Foto Siswa"
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
            >
                <Pencil size={11} />
            </button>

            {showLightBox && currentPhoto && (
                <Dialog as="div" className="relative z-[200]" open={showLightBox} onClose={() => setShowLightBox(false)}>
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" />
                    <div className="fixed inset-0 z-[210] overflow-y-auto p-4 flex items-center justify-center">
                        <Dialog.Panel className="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-xs font-black text-white uppercase tracking-wider">
                                    Foto Profil — {lead.name || 'Siswa'}
                                </p>
                                <button
                                    onClick={() => setShowLightBox(false)}
                                    className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                                <img src={currentPhoto} alt={lead.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setShowLightBox(false);
                                        fileInputRef.current?.click();
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    <Pencil size={12} /> Ganti Foto
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            )}
        </div>
    );
}

function StudentNotesSection({ student }) {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesText, setNotesText] = useState(student.notes || '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    const handleSaveNotes = async () => {
        setIsSavingNotes(true);
        try {
            await axios.put(route('admin.academic.students.update', student.id), {
                notes: notesText
            });
            student.notes = notesText;
            setIsEditingNotes(false);
        } catch (err) {
            alert('Gagal menyimpan catatan: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSavingNotes(false);
        }
    };

    return (
        <div className="space-y-2 bg-slate-50/70 border border-slate-100 p-5 rounded-2xl">
            <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400" /> Catatan / Keterangan Siswa
                </h5>
                {!isEditingNotes ? (
                    <button
                        onClick={() => {
                            setNotesText(student.notes || '');
                            setIsEditingNotes(true);
                        }}
                        className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                    >
                        Edit Catatan
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setIsEditingNotes(false)}
                            disabled={isSavingNotes}
                            className="text-[9px] font-black text-slate-500 hover:text-slate-700 uppercase tracking-widest px-2 py-0.5 rounded-md"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSaveNotes}
                            disabled={isSavingNotes}
                            className="text-[9px] font-black text-white bg-emerald-600 hover:bg-emerald-700 uppercase tracking-widest px-2.5 py-0.5 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                            {isSavingNotes && <Loader2 size={10} className="animate-spin" />}
                            Simpan
                        </button>
                    </div>
                )}
            </div>

            {!isEditingNotes ? (
                <p className="text-xs font-semibold text-slate-600 leading-relaxed pt-1 whitespace-pre-wrap">
                    {student.notes || 'Tidak ada catatan khusus untuk siswa ini.'}
                </p>
            ) : (
                <div className="pt-2">
                    <textarea
                        rows={3}
                        value={notesText}
                        onChange={e => setNotesText(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-y"
                        placeholder="Ketik catatan khusus untuk siswa ini di sini..."
                    />
                </div>
            )}
        </div>
    );
}

export default function StudentDetailModal({ show, onClose, student, onTransferClass }) {
    if (!student) return null;

    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'progress_reports'
    const [isAddingReport, setIsAddingReport] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        title: '',
        file: null,
    });

    const lead = student.lead || {};
    const progressReports = student.progress_reports || [];

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setData('file', e.target.files[0]);
        }
    };

    const handleAddReportSubmit = (e) => {
        e.preventDefault();
        post(route('admin.academic.students.progress-reports.store', student.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                setIsAddingReport(false);
            },
        });
    };

    const handleDeleteReport = (reportId) => {
        if (confirm('Apakah Anda yakin ingin menghapus progress report ini?')) {
            router.delete(route('admin.academic.students.progress-reports.destroy', [student.id, reportId]), {
                preserveScroll: true,
            });
        }
    };

    const calculateAge = (birthDateStr) => {
        if (!birthDateStr) return null;
        const birthDate = new Date(birthDateStr);
        if (isNaN(birthDate.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? `${age} thn` : null;
    };

    const age = calculateAge(lead.birth_date);
    const addressFormatted = [lead.address, lead.city, lead.province, lead.postal_code]
        .filter(Boolean)
        .join(', ');

    // Active classes & enrollments logic according to business rules:
    // If student status is 'stop', the student has NO active classes right now.
    const isStudentStopped = student.status === 'stop';
    const activeStudyClasses = isStudentStopped ? [] : (student.study_classes || []);
    const rawEnrollments = lead.enrollments || [];
    const guardians = lead.guardians || [];

    // Combine/fallback enrollments for history display
    const displayEnrollments = rawEnrollments.length > 0 
        ? rawEnrollments 
        : (student.study_classes || []).map(cls => ({
            id: cls.id,
            study_class: { id: cls.id, name: cls.name },
            cycle_number: cls.current_session_number || 1,
            status: isStudentStopped ? 'stopped' : 'active',
            formatted_joined_at: student.start_join ? new Date(student.start_join).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (student.enrolled_at || '-'),
            formatted_end_date: cls.end_session_date ? new Date(cls.end_session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
        }));

    return (
        <Transition show={show} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-[110] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl transition-all w-full sm:max-w-5xl md:max-w-6xl border border-slate-100">
                                {/* Header */}
                                <div className="px-8 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2.5">
                                            <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                                Detail Siswa
                                            </Dialog.Title>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                student.status === 'stop' 
                                                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                            }`}>
                                                {student.status}
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-400">
                                            ID Siswa: <span className="text-slate-700 font-extrabold">{student.student_number}</span> 
                                            {lead.lead_number && (
                                                <span className="ml-2">• ID Lead: <span className="text-slate-700 font-extrabold">{lead.lead_number}</span></span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Navigation Tabs */}
                                    <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl border border-slate-200/80">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('overview')}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                                activeTab === 'overview'
                                                    ? 'bg-slate-900 text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/40'
                                            }`}
                                        >
                                            <User size={14} />
                                            <span>Informasi Siswa</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('progress_reports')}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                                                activeTab === 'progress_reports'
                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                    : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
                                            }`}
                                        >
                                            <FileSpreadsheet size={14} />
                                            <span>Progress Report ({progressReports.length})</span>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all self-end sm:self-center"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
                                        <div className="flex items-center gap-4 relative z-10">
                                            <StudentProfilePhoto student={student} lead={lead} />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-black text-xl tracking-tight leading-none text-white">
                                                        {lead.name || 'Unknown Student'}
                                                    </h3>
                                                    {lead.nickname && (
                                                        <span className="px-2.5 py-0.5 bg-white/10 text-slate-200 text-xs font-bold rounded-lg border border-white/10">
                                                            "{lead.nickname}"
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 flex-wrap">
                                                    <span>{student.student_number}</span>
                                                    <span>•</span>
                                                    <span>{lead.branch?.name || 'Central'}</span>
                                                    {lead.is_online !== undefined && (
                                                        <>
                                                            <span>•</span>
                                                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                                                                lead.is_online ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                                            }`}>
                                                                {lead.is_online ? 'Online' : 'Offline'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 relative z-10 shrink-0">
                                            {student.loyalty_tier && (
                                                <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-sm flex items-center gap-1.5 ${
                                                    student.loyalty_tier.toLowerCase() === 'silver' ? 'bg-slate-700/80 text-slate-200 border-slate-500' :
                                                    student.loyalty_tier.toLowerCase() === 'gold' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                                    student.loyalty_tier.toLowerCase() === 'platinum' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                                                    'bg-red-500/20 text-red-300 border-red-500/40'
                                                }`}>
                                                    <Award size={14} />
                                                    Tier {student.loyalty_tier}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* TAB 1: OVERVIEW INFORMASI SISWA */}
                                    {activeTab === 'overview' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                            {/* LEFT COLUMN: Data Diri, Demografi & Wali */}
                                            <div className="lg:col-span-6 space-y-6">
                                                {/* Data Diri (Lead Data) */}
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                        <User size={14} className="text-red-500" /> Data Diri & Kontak (Tabel Lead)
                                                    </h4>

                                                    <div className="grid grid-cols-2 gap-3 bg-slate-50/70 border border-slate-100 p-5 rounded-2xl">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</p>
                                                            <p className="text-xs font-extrabold text-slate-800">{lead.name || '-'}</p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Panggilan</p>
                                                            <p className="text-xs font-extrabold text-slate-800">{lead.nickname || '-'}</p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Kelamin</p>
                                                            <p className="text-xs font-extrabold text-slate-800">
                                                                {lead.gender === 'L' ? 'Laki-Laki' : lead.gender === 'P' ? 'Perempuan' : (lead.gender || '-')}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Lahir / Usia</p>
                                                            <p className="text-xs font-extrabold text-slate-800">
                                                                {lead.birth_date ? (
                                                                    <>
                                                                        {new Date(lead.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        {age && <span className="ml-1 text-slate-500 font-bold">({age})</span>}
                                                                    </>
                                                                ) : '-'}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NIK (No. KTP/KK)</p>
                                                            <p className="text-xs font-extrabold text-slate-800 font-mono">
                                                                {lead.nik || student.notes?.match(/NIK:\s*(\d+)/i)?.[1] || '-'}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Telepon / WA</p>
                                                            <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                                                <Phone size={12} className="text-slate-400 shrink-0" />
                                                                {lead.phone || '-'}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                                                            <p className="text-xs font-extrabold text-slate-800 truncate flex items-center gap-1">
                                                                <Mail size={12} className="text-slate-400 shrink-0" />
                                                                {lead.email || '-'}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sekolah / Instansi</p>
                                                            <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                                                                <School size={12} className="text-slate-400 shrink-0" />
                                                                {lead.school || '-'}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tingkat Pendidikan</p>
                                                            <p className="text-xs font-extrabold text-slate-800">{lead.full_grade || lead.grade || '-'}</p>
                                                        </div>

                                                        {addressFormatted && (
                                                            <div className="space-y-1 col-span-2 pt-1.5 border-t border-slate-200/60">
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                                    <MapPin size={11} className="text-slate-400" /> Alamat Lengkap
                                                                </p>
                                                                <p className="text-xs font-bold text-slate-700 leading-relaxed">{addressFormatted}</p>
                                                            </div>
                                                        )}

                                                        {(lead.lead_source || lead.info_source || lead.lead_type) && (
                                                            <div className="space-y-1 col-span-2 pt-1.5 border-t border-slate-200/60 flex items-center gap-2 flex-wrap">
                                                                {lead.lead_source && (
                                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                                                                        Sumber: <strong className="text-slate-700">{lead.lead_source.name}</strong>
                                                                    </span>
                                                                )}
                                                                {lead.info_source && (
                                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                                                                        Info: <strong className="text-slate-700">{lead.info_source.name}</strong>
                                                                    </span>
                                                                )}
                                                                {lead.lead_type && (
                                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                                                                        Tipe: <strong className="text-slate-700">{lead.lead_type.name}</strong>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Data Wali / Parent Info */}
                                                {guardians.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <HeartHandshake size={14} className="text-indigo-500" /> Data Orang Tua / Wali
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {guardians.map((g, i) => (
                                                                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                                                    <p className="text-xs font-extrabold text-slate-800">{g.name || '-'}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{g.relation || 'Wali'} • {g.phone || '-'}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Status Loyalitas */}
                                                <div className="space-y-2 bg-slate-50/70 border border-slate-100 p-5 rounded-2xl">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Award size={12} className="text-amber-500" /> Status Loyalitas & Keikutsertaan
                                                    </h5>
                                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                                        <div>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tier Loyalitas</p>
                                                            <p className="text-xs font-black text-slate-800 uppercase mt-0.5">
                                                                {student.loyalty_tier || 'Bronze'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Paket Selesai</p>
                                                            <p className="text-xs font-black text-slate-800 uppercase mt-0.5">
                                                                {student.rejoin_count || 0} Paket
                                                            </p>
                                                        </div>
                                                        <div className="col-span-2 pt-2 border-t border-slate-200/50 flex justify-between text-[10px] font-bold text-slate-500 flex-wrap gap-2">
                                                            <span>Mulai Join: {student.start_join ? new Date(student.start_join).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (student.enrolled_at || '-')}</span>
                                                            {student.stopped_at && <span className="text-rose-600 font-extrabold">Stop: {new Date(student.stopped_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT COLUMN: Kelas Aktif, Riwayat & Catatan */}
                                            <div className="lg:col-span-6 space-y-6">
                                                {/* Kelas Aktif Saat Ini */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <BookOpen size={14} className="text-emerald-600" /> Kelas Aktif Saat Ini
                                                        </h4>
                                                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                                            {activeStudyClasses.length} Kelas Aktif
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        {activeStudyClasses.length > 0 ? (
                                                            activeStudyClasses.map((cls) => {
                                                                const warning = (() => {
                                                                    if (!cls.end_session_date) return null;
                                                                    const end = new Date(cls.end_session_date);
                                                                    const today = new Date();
                                                                    end.setHours(0,0,0,0);
                                                                    today.setHours(0,0,0,0);
                                                                    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                                                                    
                                                                    if (diffDays < 0) {
                                                                        return { text: `Telah Berakhir (${Math.abs(diffDays)} hari lalu)`, type: 'rose' };
                                                                    } else if (diffDays <= 21) {
                                                                        return { text: `Hampir Habis (${diffDays} hari lagi)`, type: 'amber' };
                                                                    }
                                                                    return null;
                                                                })();

                                                                return (
                                                                    <div key={cls.id} className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-emerald-200 transition-colors">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-xl border border-red-100 flex items-center gap-1.5">
                                                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                                                    {cls.name}
                                                                                </span>
                                                                                {cls.category && (
                                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase rounded">
                                                                                        {cls.category}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 pt-1 flex-wrap">
                                                                                {cls.current_session_number && (
                                                                                    <span>Siklus #{cls.current_session_number}</span>
                                                                                )}
                                                                                {cls.end_session_date && (
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Calendar size={12} className="text-slate-400" />
                                                                                        Target Selesai: <strong className="text-slate-700">{new Date(cls.end_session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2 self-start sm:self-center">
                                                                            {onTransferClass && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => onTransferClass(student, cls.id)}
                                                                                    className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                                                                                    title="Pindahkan siswa dari kelas ini ke kelas lain"
                                                                                >
                                                                                    <ArrowRightLeft size={11} />
                                                                                    <span>Pindah Kelas</span>
                                                                                </button>
                                                                            )}
                                                                            {warning && (
                                                                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                                                                                    warning.type === 'rose' 
                                                                                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                                }`}>
                                                                                    {warning.text}
                                                                                </span>
                                                                            )}
                                                                            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                                                                                AKTIF
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1">
                                                                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                                                                <p className="text-xs font-bold text-slate-500">
                                                                    {isStudentStopped 
                                                                        ? "Siswa berstatus STOP (Tidak ada kelas aktif saat ini)" 
                                                                        : "Siswa belum aktif di kelas manapun saat ini"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Riwayat Pendaftaran / Kelas Lain */}
                                                {displayEnrollments.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                            <History size={14} className="text-slate-500" /> Riwayat Pendaftaran Kelas
                                                        </h4>

                                                        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-50">
                                                            {displayEnrollments.map((enr, idx) => {
                                                                const isEnrStopped = isStudentStopped || enr.status === 'stopped' || enr.status === 'stop';
                                                                return (
                                                                    <div key={enr.id || idx} className="p-3.5 flex items-center justify-between text-xs gap-3">
                                                                        <div className="space-y-0.5">
                                                                            <p className="font-extrabold text-slate-800 uppercase tracking-tight">
                                                                                {enr.study_class?.name || 'Kelas Non-Aktif'}
                                                                            </p>
                                                                            <p className="text-[10px] font-bold text-slate-400">
                                                                                Siklus #{enr.cycle_number || 1} • Join: {enr.formatted_joined_at || enr.joined_at || '-'}
                                                                                {enr.formatted_end_date && ` • Selesai: ${enr.formatted_end_date}`}
                                                                            </p>
                                                                        </div>
                                                                        {(() => {
                                                                            const st = enr.status || (isEnrStopped ? 'stopped' : 'active');
                                                                            if (st === 'pending_invoice') {
                                                                                return (
                                                                                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border bg-sky-50 text-sky-600 border-sky-200">
                                                                                        Pending Invoice
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            if (st === 'pending_payment') {
                                                                                return (
                                                                                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border bg-amber-50 text-amber-600 border-amber-200">
                                                                                        Pending Payment
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            if (st === 'completed') {
                                                                                return (
                                                                                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border bg-purple-50 text-purple-600 border-purple-100">
                                                                                        Completed
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            if (st === 'stopped' || st === 'stop' || isEnrStopped) {
                                                                                return (
                                                                                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border bg-rose-50 text-rose-600 border-rose-100">
                                                                                        Stopped
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border bg-emerald-50 text-emerald-600 border-emerald-100">
                                                                                    Active
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <StudentNotesSection student={student} />
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: SEKSI KHUSUS PROGRESS REPORT SISWA */}
                                    {activeTab === 'progress_reports' && (
                                        <div className="space-y-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-sky-50/60 border border-sky-100 rounded-3xl">
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-black text-sky-950 uppercase tracking-tight flex items-center gap-2">
                                                        <FileSpreadsheet size={18} className="text-sky-600" />
                                                        Riwayat Progress Report ({progressReports.length})
                                                    </h4>
                                                    <p className="text-xs font-semibold text-sky-700/80">
                                                        Arsip dokumen evaluasi perkembangan belajar siswa (Gambar / PDF).
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingReport(!isAddingReport);
                                                        if (isAddingReport) {
                                                            reset();
                                                            clearErrors();
                                                        }
                                                    }}
                                                    className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-sky-600 hover:bg-sky-700 rounded-2xl flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto shrink-0"
                                                >
                                                    {isAddingReport ? (
                                                        <>
                                                            <X size={14} /> Batal Form
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={14} /> Upload Report Baru
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Form Upload Progress Report */}
                                            {isAddingReport && (
                                                <form onSubmit={handleAddReportSubmit} className="p-6 bg-white border border-sky-200 rounded-3xl space-y-4 shadow-sm">
                                                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                        <UploadCloud size={16} className="text-sky-600" /> Upload Progress Report Baru
                                                    </h5>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul / Nama Progress Report</label>
                                                            <input
                                                                type="text"
                                                                value={data.title}
                                                                onChange={(e) => setData('title', e.target.value)}
                                                                placeholder="cth. Progress Report Session 10 - Speaking Assessment"
                                                                className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                                                required
                                                            />
                                                            {errors.title && <p className="text-[10px] font-bold text-rose-500">{errors.title}</p>}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih File (PDF / Gambar - Max 10MB)</label>
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.png,.jpg,.jpeg,.webp"
                                                                onChange={handleFileChange}
                                                                className="w-full text-xs font-semibold text-slate-500 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
                                                                required
                                                            />
                                                            {errors.file && <p className="text-[10px] font-bold text-rose-500">{errors.file}</p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-2 border-t border-slate-100">
                                                        <Button
                                                            type="submit"
                                                            disabled={processing}
                                                            variant="primary"
                                                            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-2"
                                                        >
                                                            {processing ? (
                                                                <>
                                                                    <Loader2 size={14} className="animate-spin" /> Menyimpan...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UploadCloud size={14} /> Simpan Progress Report
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}

                                            {/* List Progress Reports Table */}
                                            <div className="space-y-3">
                                                {progressReports.length > 0 ? (
                                                    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left text-xs">
                                                                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                                    <tr>
                                                                        <th className="px-5 py-3.5">No</th>
                                                                        <th className="px-5 py-3.5">Judul Report</th>
                                                                        <th className="px-5 py-3.5">File & Tipe</th>
                                                                        <th className="px-5 py-3.5">Tanggal Upload</th>
                                                                        <th className="px-5 py-3.5 text-right">Aksi</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                                                    {progressReports.map((report, idx) => (
                                                                        <tr key={report.id} className="hover:bg-sky-50/30 transition-colors">
                                                                            <td className="px-5 py-4 font-bold text-slate-400 w-12 text-center">
                                                                                {idx + 1}
                                                                            </td>
                                                                            <td className="px-5 py-4 font-extrabold text-slate-900">
                                                                                {report.title}
                                                                            </td>
                                                                            <td className="px-5 py-4">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded border shrink-0 ${
                                                                                        report.file_type === 'pdf' 
                                                                                            ? 'bg-rose-50 text-rose-600 border-rose-200' 
                                                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                                    }`}>
                                                                                        {report.file_type === 'pdf' ? 'PDF' : 'Gambar'}
                                                                                    </span>
                                                                                    <span className="text-slate-600 truncate max-w-[200px]" title={report.file_name}>
                                                                                        {report.file_name}
                                                                                    </span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-5 py-4 text-slate-500 font-bold whitespace-nowrap">
                                                                                {report.formatted_date || report.created_at}
                                                                            </td>
                                                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                    {report.file_url && (
                                                                                        <a
                                                                                            href={report.file_url}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl border border-sky-200 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                                                                                        >
                                                                                            <ExternalLink size={12} />
                                                                                            <span>Buka File</span>
                                                                                        </a>
                                                                                    )}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeleteReport(report.id)}
                                                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                                                                                        title="Hapus Report"
                                                                                    >
                                                                                        <Trash2 size={15} />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-12 bg-slate-50/70 border border-slate-100 rounded-3xl text-center space-y-2">
                                                        <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                                                        <h5 className="text-sm font-extrabold text-slate-700">Belum ada progress report</h5>
                                                        <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto">
                                                            Siswa ini belum memiliki arsip progress report. Klik tombol 'Upload Report Baru' di atas untuk menambahkan.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={onClose}
                                        variant="primary"
                                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm"
                                    >
                                        Tutup
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
