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
} from 'lucide-react';
import DataTable from '@/Components/ui/DataTable';
import AdminPageLayout from '@/Components/shared/AdminPageLayout';
import AdminCard from '@/Components/shared/AdminCard';

import { usePtExamShow } from './hooks/usePtExamShow';
import ExamSettingsModal from './modals/ExamSettingsModal';
import QuestionModal from './modals/QuestionModal';
import QuestionGroupModal from './modals/QuestionGroupModal';

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
        openQuestionModal, openGroupModal,
        searchQuery, setSearchQuery, filteredItems,
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
                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 w-fit">
                    <Music size={12} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Audio</span>
                </div>
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
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                            <Settings size={16} /> Settings
                        </button>
                        <button
                            onClick={() => openGroupModal()}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold shadow-sm hover:bg-red-50 transition-all flex items-center gap-2"
                        >
                            <Layers size={16} /> New Group
                        </button>
                        <button
                            onClick={() => openQuestionModal()}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> New Question
                        </button>
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
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    type="text"
                                    placeholder="Search questions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm font-medium w-full md:w-72 focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all outline-none"
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
        </AdminLayout>
    );
}
