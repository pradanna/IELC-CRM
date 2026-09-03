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
    Layers,
    FileQuestion,
    PlayCircle,
} from "lucide-react";
import DataTable from "@/Components/ui/DataTable";
import Button from "@/Components/ui/Button";
import SearchInput from "@/Components/ui/SearchInput";
import AdminPageLayout from "@/Components/shared/AdminPageLayout";
import AdminCard from "@/Components/shared/AdminCard";

import { usePtExamShow } from "./hooks/usePtExamShow";
import ExamSettingsModal from "./modals/ExamSettingsModal";
import McqQuestionModal from "./modals/McqQuestionModal";
import QuestionGroupModal from "./modals/QuestionGroupModal";
import Modal from "@/Components/ui/Modal";
import Exam from "@/Pages/Public/PlacementTest/Exam";

export default function ShowGeneral({ exam }) {
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
            render: (row) =>
                row.isGroupHeader ? (
                    ""
                ) : (
                    <span className="text-[10px] uppercase font-black text-slate-400">
                        Q{row.number}
                    </span>
                ),
        },
        {
            header: "Pertanyaan / Instruksi",
            accessor: "text",
            render: (row) => {
                if (row.isGroupHeader) {
                    const sectionBadge = row.section_type ? (
                        row.section_type === "reading" ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                                Reading
                            </span>
                        ) : row.section_type === "listening" ? (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Listening
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-violet-50 text-violet-600 border border-violet-100">
                                Speaking
                            </span>
                        )
                    ) : null;

                    return (
                        <div className="flex items-center gap-3 py-1">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                <Layers size={16} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest leading-none">
                                        Question Group
                                    </p>
                                    {sectionBadge}
                                </div>
                                <p className="text-sm font-bold text-slate-900 leading-snug">
                                    {row.instruction}
                                </p>
                            </div>
                        </div>
                    );
                }
                return (
                    <div
                        className={`flex items-start gap-3 py-1 ${row.isGrouped ? "ml-10 border-l-2 border-slate-100 pl-4" : ""}`}
                    >
                        {!row.isGrouped && (
                            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                                <FileQuestion size={16} />
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-slate-800 leading-relaxed line-clamp-2">
                                {row.question_text}
                            </p>
                            {row.options && row.options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                    {row.options.map((opt, i) => (
                                        <span
                                            key={i}
                                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${opt.is_correct ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                                        >
                                            {opt.text}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Media",
            accessor: "audio_path",
            className: "w-24",
            render: (row) => {
                if (!row.audio_path)
                    return (
                        <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest ml-2">
                            —
                        </span>
                    );

                const isMedia = row.audio_path
                    .toLowerCase()
                    .match(/\.(mp3|wav|mp4|mpeg|webm)$/);

                return (
                    <button
                        onClick={() => openMediaModal(row.audio_path)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border w-fit transition-all group ${
                            isMedia
                                ? "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-600 hover:text-white"
                                : "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-600 hover:text-white"
                        }`}
                    >
                        {isMedia ? (
                            <PlayCircle
                                size={12}
                                className="group-hover:scale-110 transition-transform"
                            />
                        ) : (
                            <FileText
                                size={12}
                                className="group-hover:scale-110 transition-transform"
                            />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                            {isMedia ? "Play" : "View"}
                        </span>
                    </button>
                );
            },
        },
        {
            header: "Poin",
            accessor: "points",
            className: "w-16 text-center",
            render: (row) =>
                row.isGroupHeader ? (
                    ""
                ) : (
                    <span className="text-xs font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                        {row.points}
                    </span>
                ),
        },
        {
            header: "Actions",
            accessor: "id",
            className: "w-32 text-right",
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    {row.isGroupHeader ? (
                        <>
                            <button
                                onClick={() => openQuestionModal(row)}
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm border border-blue-100"
                                title="Add Question to Group"
                            >
                                <Plus size={14} />
                            </button>
                            <button
                                onClick={() => openGroupModal(row)}
                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg transition-all border border-slate-100"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteGroup(row.id)}
                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg transition-all border border-slate-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => openQuestionModal(null, row)}
                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-lg transition-all border border-slate-100"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button
                                onClick={() => handleDeleteQuestion(row.id)}
                                className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg transition-all border border-slate-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title={`General PT - ${examData.title}`} />

            <AdminPageLayout
                title={examData.title}
                subtitle={
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            General / Adult Placement
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-500">
                            {examData.questions_count} Questions
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs font-bold text-slate-500">
                            {examData.duration_minutes} Minutes
                        </span>
                    </div>
                }
                backLink={
                    <Link
                        href={route("admin.placement-tests.index")}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                }
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
                        >
                            Settings
                        </Button>
                        <Button
                            variant="outline"
                            icon={FileText}
                            onClick={() => setIsPreviewOpen(true)}
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                            Preview
                        </Button>
                        <Button
                            variant="outline"
                            icon={Layers}
                            onClick={() => openGroupModal()}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            New Group
                        </Button>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => openQuestionModal()}
                            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            New Question
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
                                    Question & Option List
                                </h2>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                    Kelola soal pilihan ganda, listening audio,
                                    dan passage reading
                                </p>
                            </div>
                            <div className="w-full md:w-72">
                                <SearchInput
                                    placeholder="Search general questions..."
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
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-300 mx-auto border-2 border-dashed border-blue-200">
                                    <FileQuestion size={28} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900 tracking-tight">
                                        Belum ada soal di paket General PT ini
                                    </p>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        Mulai dengan membuat Group soal (misal
                                        Reading/Listening) atau langsung tambah
                                        pertanyaan pilihan ganda.
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        icon={Layers}
                                        onClick={() => openGroupModal()}
                                        className="text-xs font-bold text-blue-600 border-blue-200"
                                    >
                                        Buat Group
                                    </Button>
                                    <Button
                                        variant="primary"
                                        icon={Plus}
                                        onClick={() => openQuestionModal()}
                                        className="text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
                                    >
                                        <FileQuestion size={14} />
                                        Tambah Soal
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

            <McqQuestionModal
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
                                Interactive General Test Preview
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
                                    remaining_seconds: (examData.duration_minutes || 60) * 60,
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
