import React from "react";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    ArrowLeft,
    Plus,
    Settings,
    Trash2,
    Edit2,
    FileText,
    Palette,
    PlayCircle,
    LayoutGrid,
} from "lucide-react";
import DataTable from "@/Components/ui/DataTable";
import Button from "@/Components/ui/Button";
import SearchInput from "@/Components/ui/SearchInput";
import AdminPageLayout from "@/Components/shared/AdminPageLayout";
import AdminCard from "@/Components/shared/AdminCard";

import { usePtExamShow } from "./hooks/usePtExamShow";
import ExamSettingsModal from "./modals/ExamSettingsModal";
import KidsCanvasModal from "./modals/KidsCanvasModal";
import QuestionGroupModal from "./modals/QuestionGroupModal";
import Modal from "@/Components/ui/Modal";
import Exam from "@/Pages/Public/PlacementTest/Exam";

export default function ShowKids({ exam }) {
    const examData = exam.data;

    const {
        isSettingsOpen,
        setIsSettingsOpen,
        isQuestionModalOpen,
        setIsQuestionModalOpen,
        isGroupModalOpen,
        setIsGroupModalOpen,
        editingQuestion,
        editingGroup,
        targetGroupId,
        settingsForm,
        questionForm,
        groupForm,
        handleSettingsSubmit,
        handleQuestionSubmit,
        handleGroupSubmit,
        handleDeleteExam,
        handleDeleteQuestion,
        handleDeleteGroup,
        openQuestionModal,
        openGroupModal,
        openMediaModal,
        searchQuery,
        setSearchQuery,
        filteredItems,
        mediaModal,
        setMediaModal,
        isPreviewOpen,
        setIsPreviewOpen,
        previewPages,
    } = usePtExamShow(examData);

    const columns = [
        {
            header: "#",
            accessor: "number",
            className: "w-12 text-slate-400 font-bold",
            render: (row) => (
                <span className="text-[10px] uppercase font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    K{row.number}
                </span>
            ),
        },
        {
            header: "Canvas Interaktif / Task Anak",
            accessor: "text",
            render: (row) => (
                <div className="flex items-start gap-3 py-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                        <Palette size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-100">
                                {row.mode || "Drag & Drop Canvas"}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed">
                            {row.question_text ||
                                row.text ||
                                "Interactive Kid Canvas Task"}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            header: "Audio Panduan",
            accessor: "audio_path",
            className: "w-28",
            render: (row) => {
                if (!row.audio_path)
                    return (
                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest ml-2">
                            —
                        </span>
                    );

                return (
                    <button
                        onClick={() => openMediaModal(row.audio_path)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-600 hover:text-white transition-all group"
                    >
                        <PlayCircle
                            size={13}
                            className="group-hover:scale-110 transition-transform"
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            Play Audio
                        </span>
                    </button>
                );
            },
        },
        {
            header: "Poin / Item",
            accessor: "points",
            className: "w-28 text-center whitespace-nowrap",
            render: (row) =>
                row.isGroupHeader ? (
                    ""
                ) : (
                    <span className="inline-flex items-center justify-center whitespace-nowrap text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                        {row.points || 1} pt
                    </span>
                ),
        },
        {
            header: "Actions",
            accessor: "id",
            className: "w-32 text-right",
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        onClick={() => openQuestionModal(null, row)}
                        className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-lg transition-all border border-amber-200"
                        title="Buka Canvas Studio Builder"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => handleDeleteQuestion(row.id)}
                        className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg transition-all border border-slate-100"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title={`Kids Placement Test - ${examData.title}`} />

            <AdminPageLayout
                title={examData.title}
                subtitle={
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border bg-amber-50 text-amber-800 border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Kids Placement (Interactive Canvas)
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-500">
                            {examData.questions_count} Canvas Soal
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-500">
                            {examData.duration_minutes} Menit
                        </span>
                    </div>
                }
                backLink={
                    <Link
                        href={route("admin.placement-tests.index")}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                }
                actions={
                    <div className="flex items-center gap-2">
                        <Link href={route("admin.placement-tests.index")}>
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
                        >
                            Settings
                        </Button>
                        <Button
                            variant="outline"
                            icon={FileText}
                            onClick={() => setIsPreviewOpen(true)}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                            Kids Preview
                        </Button>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => openQuestionModal()}
                            className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20 text-white"
                        >
                            New Canvas Studio
                        </Button>
                    </div>
                }
            >
                <AdminCard
                    padding="p-0"
                    header={
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-black text-slate-900 tracking-tight">
                                    Kids Interactive Canvas Studio List
                                </h2>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                    Kelola soal interaktif visual, drag & drop,
                                    gambar objek, dan rekaman suara anak
                                </p>
                            </div>
                            <div className="w-full md:w-72">
                                <SearchInput
                                    placeholder="Search canvas tasks..."
                                    value={searchQuery}
                                    onChange={(v) => setSearchQuery(v)}
                                />
                            </div>
                        </div>
                    }
                >
                    <div className="p-4">
                        {filteredItems.length > 0 ? (
                            <DataTable
                                columns={columns}
                                data={filteredItems}
                                noPanel={true}
                            />
                        ) : (
                            <div className="text-center py-20 space-y-4">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-400 mx-auto border-2 border-dashed border-amber-200">
                                    <Palette size={28} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900 tracking-tight">
                                        Belum ada canvas soal di paket Kids ini
                                    </p>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        Buka Canvas Studio untuk merancang soal
                                        interaktif (drag target, drop items,
                                        background visual).
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <Button
                                        variant="primary"
                                        icon={Palette}
                                        onClick={() => openQuestionModal()}
                                        className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                                    >
                                        Buka Canvas Studio
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </AdminCard>
            </AdminPageLayout>

            {/* Modals */}
            <ExamSettingsModal
                show={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                form={settingsForm}
                onSubmit={handleSettingsSubmit}
                onDelete={handleDeleteExam}
                hasSessions={examData.has_sessions}
            />

            <KidsCanvasModal
                show={isQuestionModalOpen}
                onClose={() => setIsQuestionModalOpen(false)}
                form={questionForm}
                onSubmit={handleQuestionSubmit}
                editingQuestion={editingQuestion}
                targetGroupId={targetGroupId}
            />

            <QuestionGroupModal
                show={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                form={groupForm}
                onSubmit={handleGroupSubmit}
                editingGroup={editingGroup}
            />

            {/* Media Modal */}
            <Modal
                show={mediaModal.show}
                onClose={() => setMediaModal({ ...mediaModal, show: false })}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="text-base font-black text-slate-900 tracking-tight mb-4">
                        Media Preview
                    </h3>
                    {mediaModal.type === "video" ? (
                        <video
                            controls
                            className="w-full rounded-2xl shadow-sm"
                        >
                            <source src={mediaModal.url} />
                        </video>
                    ) : (
                        <audio controls className="w-full">
                            <source src={mediaModal.url} />
                        </audio>
                    )}
                </div>
            </Modal>

            {/* Public Exam Preview Modal */}
            <Modal
                show={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                maxWidth="6xl"
            >
                <div className="p-6 h-[85vh] flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">
                                Interactive Kids Placement Preview
                            </h3>
                            <p className="text-xs text-slate-400">
                                Live candidate view
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setIsPreviewOpen(false)}
                            className="text-xs"
                        >
                            Close Preview
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto mt-4 rounded-2xl border border-slate-100 p-2">
                        {previewPages.length > 0 ? (
                            <Exam
                                pages={previewPages}
                                exam_title={examData.title}
                                exam_category={examData.category}
                                session={{
                                    session_token: "PREVIEW_MODE",
                                    is_preview: true,
                                    remaining_seconds:
                                        (examData.duration_minutes || 30) * 60,
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
                                No questions configured to preview.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
