import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import AdminCard from '@/Components/shared/AdminCard';
import Button from '@/Components/ui/Button';
import SearchInput from '@/Components/ui/SearchInput';
import DataTable from '@/Components/ui/DataTable';
import Modal from '@/Components/ui/Modal';
import { 
    Plus, Settings, FileText, Headphones, BookOpen, PenTool, 
    Mic, Trash2, Edit2, Music, Clock, AlertTriangle, CheckCircle2, RefreshCw, ArrowLeft 
} from 'lucide-react';
import { usePtExamShow } from './hooks/usePtExamShow';
import ExamSettingsModal from './modals/ExamSettingsModal';
import IeltsTaskModal from './modals/IeltsTaskModal';
import Exam from '@/Pages/Public/PlacementTest/Exam';

const SKILL_BADGES = {
    listening: { label: 'Listening', icon: Headphones, color: 'bg-sky-50 text-sky-700 border-sky-200' },
    reading: { label: 'Reading', icon: BookOpen, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    writing: { label: 'Writing', icon: PenTool, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    speaking: { label: 'Speaking', icon: Mic, color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function ShowIelts({ exam }) {
    const {
        examData,
        isSettingsOpen,
        setIsSettingsOpen,
        settingsForm,
        handleSettingsSubmit,
        handleDeleteExam,
        isQuestionModalOpen,
        setIsQuestionModalOpen,
        questionForm,
        editingQuestion,
        openQuestionModal,
        handleQuestionSubmit,
        handleDeleteQuestion,
        previewPages,
        mediaModal,
        setMediaModal,
    } = usePtExamShow({ exam });

    const activeExam = examData || exam?.data || exam || {};
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [syncing, setSyncing] = useState(false);

    const rawTasks = activeExam.standalone_questions || [];
    const tasksList = rawTasks.filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (item.title || item.question_text || '').toLowerCase().includes(q) ||
               (item.skill_type || '').toLowerCase().includes(q) ||
               (item.description || '').toLowerCase().includes(q);
    });

    // Kalkulasi Waktu & Sinkronisasi
    const totalTaskMinutes = rawTasks.reduce((acc, t) => acc + (parseInt(t.duration_minutes) || 0), 0);
    const examDuration = parseInt(activeExam.duration_minutes) || 0;
    const isDurationSynced = totalTaskMinutes === 0 || totalTaskMinutes === examDuration;

    const handleSyncDuration = () => {
        if (totalTaskMinutes === 0) return;
        setSyncing(true);
        router.put(route('admin.placement-tests.update', activeExam.id), {
            title: activeExam.title,
            category: activeExam.category,
            description: activeExam.description,
            duration_minutes: totalTaskMinutes,
            is_active: activeExam.is_active,
        }, {
            preserveScroll: true,
            onFinish: () => setSyncing(false),
        });
    };

    const columns = [
        {
            header: '#',
            accessor: 'number',
            className: 'w-12 text-center font-bold text-slate-400',
        },
        {
            header: 'Modul Skill',
            accessor: 'skill_type',
            className: 'w-36',
            render: (row) => {
                const badge = SKILL_BADGES[row.skill_type] || SKILL_BADGES.writing;
                const Icon = badge.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${badge.color}`}>
                        <Icon size={13} />
                        <span>{badge.label}</span>
                    </span>
                );
            },
        },
        {
            header: 'Task & Informasi',
            accessor: 'title',
            render: (row) => (
                <div className="space-y-1">
                    <p className="text-sm font-black text-slate-900 leading-snug">{row.title || row.question_text}</p>
                    {row.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{row.description}</p>
                    )}
                </div>
            ),
        },
        {
            header: 'Berkas Lampiran (PDF / Audio)',
            accessor: 'files',
            render: (row) => (
                <div className="flex items-center gap-1.5 flex-wrap">
                    {row.audio_path && (
                        <a
                            href={row.audio_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold hover:bg-sky-100 transition-colors"
                        >
                            <Music size={11} /> Audio MP3
                        </a>
                    )}
                    {row.question_pdf_path && (
                        <a
                            href={row.question_pdf_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold hover:bg-red-100 transition-colors"
                        >
                            <FileText size={11} /> PDF Soal
                        </a>
                    )}
                    {row.answer_sheet_pdf_path && (
                        <a
                            href={row.answer_sheet_pdf_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                        >
                            <FileText size={11} /> PDF Lembar Jawab
                        </a>
                    )}
                    {!row.audio_path && !row.question_pdf_path && !row.answer_sheet_pdf_path && (
                        <span className="text-slate-400 text-xs font-medium italic">-</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Durasi / Skor',
            accessor: 'points',
            className: 'w-32 text-center',
            render: (row) => (
                <div className="text-center space-y-0.5">
                    <span className="font-mono font-black text-xs text-indigo-600 block">Band {row.points || '9.0'}</span>
                    {row.duration_minutes ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock size={10} className="text-slate-400" />
                            {row.duration_minutes} mnt
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">Tanpa limit</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Aksi',
            accessor: 'actions',
            className: 'w-24 text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => openQuestionModal(row)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Edit Task"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => handleDeleteQuestion(row.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Task"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout activeMenu="crm.placement_tests">
            <Head title={`IELTS Diagnostic: ${activeExam.title} - IELC CRM`} />

            <AdminPageLayout
                title={activeExam.title}
                subtitle="Manajemen Paket Ujian Diagnostic IELTS (Listening, Reading, Writing & Speaking)"
                actions={
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.placement-tests.index')}>
                            <Button
                                variant="outline"
                                icon={ArrowLeft}
                                className="text-xs font-bold text-slate-600 hover:text-slate-900 border-slate-200"
                            >
                                Kembali
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            icon={Settings}
                            onClick={() => setIsSettingsOpen(true)}
                            className="text-xs font-bold"
                        >
                            Settings
                        </Button>
                        <Button
                            variant="outline"
                            icon={FileText}
                            onClick={() => setIsPreviewOpen(true)}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs font-bold"
                        >
                            Preview Peserta
                        </Button>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => openQuestionModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 text-white text-xs font-bold"
                        >
                            Tambah Task IELTS
                        </Button>
                    </div>
                }
            >
                {/* Duration Synchronization Alert / Summary Card */}
                <div className="mb-6">
                    {totalTaskMinutes > 0 && !isDurationSynced ? (
                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-start sm:items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-amber-900 leading-tight">
                                        Durasi Paket Ujian Belum Sinkron
                                    </h3>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        Total alokasi waktu task ({totalTaskMinutes} menit) berbeda dengan batas durasi paket soal ({examDuration} menit).
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                icon={RefreshCw}
                                onClick={handleSyncDuration}
                                disabled={syncing}
                                className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60 text-xs font-black shrink-0"
                            >
                                {syncing ? 'Menyinkronkan...' : `Sinkronkan Durasi Paket ke ${totalTaskMinutes} Menit`}
                            </Button>
                        </div>
                    ) : totalTaskMinutes > 0 ? (
                        <div className="p-3.5 px-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                <p className="text-xs font-bold text-emerald-900">
                                    Durasi Waktu Tersinkronisasi: <span className="font-extrabold">{examDuration} Menit</span> (Total {rawTasks.length} Modul Task IELTS)
                                </p>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                                Timer Siap Digunakan
                            </span>
                        </div>
                    ) : null}
                </div>

                <AdminCard
                    padding="p-0"
                    header={
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-black text-slate-900 tracking-tight">
                                    Daftar Modul Task IELTS ({tasksList.length} Task)
                                </h2>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                    Kelola file PDF Soal, Answer Sheet, Audio Listening, dan Rubric Penilaian
                                </p>
                            </div>
                            <div className="w-full md:w-72">
                                <SearchInput
                                    placeholder="Cari task IELTS..."
                                    value={searchQuery}
                                    onChange={(v) => setSearchQuery(v)}
                                />
                            </div>
                        </div>
                    }
                >
                    <div className="p-4">
                        {tasksList.length > 0 ? (
                            <DataTable columns={columns} data={tasksList} noPanel={true} />
                        ) : (
                            <div className="text-center py-20 space-y-4">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto border-2 border-dashed border-indigo-200">
                                    <PenTool size={28} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900 tracking-tight">Belum ada Task di paket IELTS ini</p>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        Klik tombol di bawah untuk menambahkan task Listening, Reading, Writing, atau Speaking.
                                    </p>
                                </div>
                                <div className="pt-2 flex justify-center items-center">
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => openQuestionModal()}
                                        className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 mx-auto"
                                    >
                                        Tambah Task IELTS Pertama
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </AdminCard>
            </AdminPageLayout>

            {/* Settings Modal */}
            <ExamSettingsModal
                show={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                form={settingsForm}
                onSubmit={handleSettingsSubmit}
                onDelete={handleDeleteExam}
                hasSessions={activeExam.has_sessions}
            />

            {/* IELTS Task Modal */}
            <IeltsTaskModal
                show={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                form={questionForm}
                onSubmit={handleQuestionSubmit}
                editingQuestion={editingQuestion}
            />

            {/* Candidate Preview Modal */}
            <Modal show={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="6xl">
                <div className="p-6 h-[85vh] flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">IELTS Candidate Live Preview</h3>
                            <p className="text-xs text-slate-400">Tampilan langsung yang dilihat oleh peserta</p>
                        </div>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="text-xs">
                            Tutup Preview
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto mt-4 rounded-2xl border border-slate-100 p-2">
                        {previewPages.length > 0 ? (
                            <Exam
                                pages={previewPages}
                                exam_title={activeExam.title}
                                exam_category={activeExam.category}
                                session={{
                                    session_token: 'PREVIEW_MODE',
                                    is_preview: true,
                                    remaining_seconds: (activeExam.duration_minutes || 60) * 60,
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
                                Belum ada task yang dikonfigurasi untuk preview.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}