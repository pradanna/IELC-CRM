import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowLeft,
    Plus,
    Settings,
    Trash2,
    Edit2,
    FileText,
    Layers,
    ChevronRight,
    FileQuestion,
    Music,
    Search,
    Play,
    PlayCircle,
} from 'lucide-react';
import DataTable from '@/Components/ui/DataTable';
import Button from '@/Components/ui/Button';
import SearchInput from '@/Components/ui/SearchInput';
import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import AdminCard from '@/Components/shared/AdminCard';

import { usePtExamShow } from './hooks/usePtExamShow';
import ExamSettingsModal from './modals/ExamSettingsModal';
import QuestionModal from './modals/QuestionModal';
import QuestionGroupModal from './modals/QuestionGroupModal';
import Modal from '@/Components/ui/Modal';
import Exam from '@/Pages/Public/PlacementTest/Exam';

export default function Show({ exam }) {
    const examData = exam.data;

    const {
        isSettingsOpen, setIsSettingsOpen,
        isQuestionModalOpen, setIsQuestionModalOpen,
        isGroupModalOpen, setIsGroupModalOpen,
        editingQuestion, editingGroup, targetGroupId,
        settingsForm, questionForm, groupForm,
        handleSettingsSubmit, handleQuestionSubmit, handleGroupSubmit,
        handleDeleteQuestion, handleDeleteGroup,
        openQuestionModal, openGroupModal, openMediaModal,
        searchQuery, setSearchQuery, filteredItems,
        mediaModal, setMediaModal,
        isPreviewOpen, setIsPreviewOpen, previewPages,
    } = usePtExamShow(examData);

    const columns = [
        {
            header: '#',
            accessor: 'number',
            className: 'w-12 text-slate-400 font-bold',
            render: (row) => row.isGroupHeader ? '' : <span className="text-[10px] uppercase font-black text-slate-400">Q{row.number}</span>,
        },
        {
            header: 'Content',
            accessor: 'text',
            render: (row) => {
                if (row.isGroupHeader) {
                    return (
                        <div className="flex items-center gap-3 py-1">
                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                                <Layers size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-red-600 uppercase tracking-widest leading-none mb-1">Question Group</p>
                                <p className="text-sm font-bold text-slate-900 leading-snug">{row.instruction}</p>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className={`flex items-start gap-3 py-1 ${row.isGrouped ? 'ml-10 border-l-2 border-slate-100 pl-4' : ''}`}>
                        {!row.isGrouped && (
                            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 border border-slate-100">
                                <FileQuestion size={16} />
                            </div>
                        )}
                        <p className="text-sm font-medium text-slate-700 leading-relaxed line-clamp-2">{row.question_text}</p>
                    </div>
                );
            },
        },
        {
            header: 'Media',
            accessor: 'audio_path',
            className: 'w-24',
            render: (row) => row.audio_path ? (
                <button
                    onClick={() => openMediaModal(row.audio_path)}
                    className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 w-fit hover:bg-blue-600 hover:text-white transition-all group"
                >
                    <PlayCircle size={12} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Play</span>
                </button>
            ) : <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest ml-2">—</span>,
        },
        {
            header: 'Pts',
            accessor: 'points',
            className: 'w-16 text-center',
            render: (row) => row.isGroupHeader ? '' : (
                <span className="text-xs font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">{row.points}</span>
            ),
        },
        {
            header: 'Actions',
            accessor: 'id',
            className: 'w-32 text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1.5">
                    {row.isGroupHeader ? (
                        <>
                            <button
                                onClick={() => openQuestionModal(row)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all shadow-sm border border-red-100"
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
            <Head title={`Builder - ${examData.title}`} />

            <AdminPageLayout
                title={examData.title}
                subtitle={`${examData.questions_count} Questions • ${examData.duration_minutes} Minutes`}
                backLink={
                    <Link
                        href={route('admin.placement-tests.index')}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                }
                actions={
                    <div className="flex items-center gap-2">
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
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            New Group
                        </Button>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => openQuestionModal()}
                            className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
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
                                <h2 className="text-base font-black text-slate-900 tracking-tight">Question List</h2>
                                <p className="text-xs font-medium text-slate-400 mt-0.5">Manage assessment items and structure</p>
                            </div>
                            <div className="w-full md:w-72">
                                <SearchInput
                                    placeholder="Search questions..."
                                    value={searchQuery}
                                    onChange={(v) => setSearchQuery(v)}
                                />
                            </div>
                        </div>
                    }
                >
                    <div className="p-2">
                        <DataTable columns={columns} data={filteredItems} />
                        {filteredItems.length === 0 && (
                            <div className="text-center py-24 space-y-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto border-2 border-dashed border-slate-200">
                                    <FileQuestion size={32} />
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900 tracking-tight">No assessment items yet</p>
                                    <p className="text-sm text-slate-400 mt-1">Start by adding a question or a question group.</p>
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
            />
            <QuestionModal
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

            {/* Media Preview Modal */}
            <Modal show={mediaModal.show} onClose={() => setMediaModal({ ...mediaModal, show: false })} maxWidth="xl">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Media Preview</h2>
                            <p className="text-xs text-slate-400 capitalize">{mediaModal.type} Resource</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Play size={20} />
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        {mediaModal.type === 'video' ? (
                            <video 
                                src={mediaModal.url} 
                                controls 
                                className="w-full rounded-lg shadow-sm"
                                autoPlay
                            />
                        ) : (
                            <div className="py-4">
                                <audio 
                                    src={mediaModal.url} 
                                    controls 
                                    className="w-full"
                                    autoPlay
                                />
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <Button variant="outline" onClick={() => setMediaModal({ ...mediaModal, show: false })}>
                            Close Preview
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal show={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="6xl">
                <div className="h-[85vh] flex flex-col overflow-hidden rounded-2xl">
                    <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <FileText size={20} />
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest">Student Preview Mode</h2>
                                <p className="text-[10px] opacity-80">Testing the experience as seen by candidates</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsPreviewOpen(false)}
                            className="p-1 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-black transition-all"
                        >
                            Exit Preview
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                        <Exam 
                            exam_title={examData.title}
                            pages={previewPages}
                            session={{ 
                                token: 'preview', 
                                remaining_seconds: examData.duration_minutes * 60 
                            }}
                        />
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
