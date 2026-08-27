import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';

export function usePtExamShow(param) {
    const examData = param?.exam?.data || param?.exam || param?.data || param || {};

    // Modals visibility
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [mediaModal, setMediaModal] = useState({ show: false, url: '', type: 'audio' });

    // Editing states
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [targetGroupId, setTargetGroupId] = useState(null);

    // Search filter
    const [searchQuery, setSearchQuery] = useState('');

    // Forms
    const settingsForm = useForm({
        title: examData.title || '',
        category: examData.category || 'General',
        description: examData.description || '',
        duration_minutes: examData.duration_minutes || 60,
        is_active: examData.is_active ?? true,
    });

    const questionForm = useForm({
        pt_question_group_id: null,
        skill_type: 'writing',
        title: '',
        description: '',
        type: 'mcq',
        question_text: '',
        points: 1,
        max_score: 9.0,
        min_words: '',
        duration_minutes: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        canvas_data: null,
        media: null,
        audio: null,
        question_pdf: null,
        answer_sheet_pdf: null,
    });

    const groupForm = useForm({
        instruction: '',
        section_type: null,
        reading_text: '',
        media: null,
        reading_file: null,
    });

    // Submit Handlers
    const handleSettingsSubmit = (e) => {
        e.preventDefault();
        settingsForm.put(route('admin.placement-tests.update', examData.id), {
            onSuccess: () => setIsSettingsOpen(false),
        });
    };

    const handleQuestionSubmit = (e) => {
        e.preventDefault();
        if (editingQuestion) {
            questionForm.post(route('admin.placement-tests.questions.update', [examData.id, editingQuestion.id]), {
                forceFormData: true,
                onSuccess: () => {
                    setIsQuestionModalOpen(false);
                    setEditingQuestion(null);
                },
            });
        } else {
            questionForm.post(route('admin.placement-tests.questions.store', examData.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsQuestionModalOpen(false);
                    questionForm.reset();
                },
            });
        }
    };

    const handleGroupSubmit = (e) => {
        e.preventDefault();
        if (editingGroup) {
            groupForm.post(route('admin.placement-tests.question-groups.update', [examData.id, editingGroup.id]), {
                forceFormData: true,
                onSuccess: () => {
                    setIsGroupModalOpen(false);
                    setEditingGroup(null);
                },
            });
        } else {
            groupForm.post(route('admin.placement-tests.question-groups.store', examData.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsGroupModalOpen(false);
                    groupForm.reset();
                },
            });
        }
    };

    // Delete Handlers
    const handleDeleteExam = () => {
        if (examData.has_sessions) {
            alert('Paket ujian ini tidak dapat dihapus karena sudah memiliki riwayat sesi pengerjaan oleh lead / siswa.');
            return;
        }
        if (confirm(`Apakah Anda yakin ingin menghapus seluruh paket ujian "${examData.title}"?`)) {
            router.delete(route('admin.placement-tests.destroy', examData.id));
        }
    };

    const handleDeleteQuestion = (id) => {
        if (confirm('Delete this question / task?')) {
            router.delete(route('admin.placement-tests.questions.destroy', [examData.id, id]));
        }
    };

    const handleDeleteGroup = (id) => {
        if (confirm('Delete this group and all its questions?')) {
            router.delete(route('admin.placement-tests.question-groups.destroy', [examData.id, id]));
        }
    };

    // Modal Openers
    const openQuestionModal = (group = null, q = null) => {
        // Jika dipanggil dari ShowIelts dengan q langsung
        const item = q || (group && !group.isGroupHeader ? group : null);
        const actualGroup = group && group.isGroupHeader ? group : null;

        setTargetGroupId(actualGroup?.id || null);

        if (item) {
            setEditingQuestion(item);
            let canvasData = null;
            if (item.type === 'drag_drop') {
                if (item.kid_canvas?.canvas_data) {
                    canvasData = typeof item.kid_canvas.canvas_data === 'string'
                        ? JSON.parse(item.kid_canvas.canvas_data)
                        : item.kid_canvas.canvas_data;
                }
            }

            questionForm.setData({
                pt_question_group_id: item.pt_question_group_id || null,
                skill_type: item.skill_type || 'writing',
                title: item.title || item.question_text || '',
                description: item.description || '',
                type: item.type || (examData.category === 'IELTS' ? 'ielts_task' : 'mcq'),
                question_text: item.question_text || item.title || '',
                points: item.points || 1,
                max_score: item.points || item.max_score || 9.0,
                min_words: item.min_words || '',
                duration_minutes: item.duration_minutes || '',
                options: (item.options || []).map((o) => o.text),
                correct_answer: (item.options || []).findIndex((o) => o.is_correct),
                canvas_data: canvasData,
                media: null,
                audio: null,
                question_pdf: null,
                answer_sheet_pdf: null,
            });
        } else {
            setEditingQuestion(null);
            const defaultType = examData.category === 'IELTS' ? 'ielts_task' : examData.category === 'Kids' ? 'drag_drop' : 'mcq';
            questionForm.setData({
                pt_question_group_id: actualGroup?.id || null,
                skill_type: 'writing',
                title: '',
                description: '',
                type: defaultType,
                question_text: '',
                points: examData.category === 'IELTS' ? 9.0 : 1,
                max_score: 9.0,
                min_words: '',
                duration_minutes: '',
                options: ['', '', '', ''],
                correct_answer: 0,
                canvas_data: null,
                media: null,
                audio: null,
                question_pdf: null,
                answer_sheet_pdf: null,
            });
        }
        setIsQuestionModalOpen(true);
    };

    const openGroupModal = (g = null) => {
        if (g) {
            setEditingGroup(g);
            groupForm.setData({
                instruction: g.instruction,
                section_type: g.section_type || null,
                reading_text: g.reading_text,
                media: null,
                reading_file: null,
            });
        } else {
            setEditingGroup(null);
            groupForm.reset();
        }
        setIsGroupModalOpen(true);
    };

    const openMediaModal = (url) => {
        const isVideo = url.toLowerCase().match(/\.(mp4|mpeg|webm)$/);
        setMediaModal({
            show: true,
            url: url,
            type: isVideo ? 'video' : 'audio'
        });
    };

    // Table Items (memoized)
    const tableItems = useMemo(() => {
        const items = [];
        const rawGroups = examData.question_groups || [];
        const groups = Array.isArray(rawGroups) ? rawGroups : Object.values(rawGroups);
        const rawStandalone = examData.standalone_questions || [];
        const standalone = Array.isArray(rawStandalone) ? rawStandalone : Object.values(rawStandalone);

        const combined = [
            ...groups.map((g) => ({ ...g, _type: 'group' })),
            ...standalone.map((q) => ({ ...q, _type: 'question' })),
        ].sort((a, b) => a.position - b.position);

        combined.forEach((item) => {
            if (item._type === 'group') {
                items.push({ ...item, isGroupHeader: true });
                const groupQuestions = Array.isArray(item.questions) ? item.questions : Object.values(item.questions || {});
                groupQuestions.sort((a, b) => (a.position - b.position) || (a.number - b.number)).forEach((q) => {
                    items.push({ ...q, isGrouped: true });
                });
            } else {
                items.push(item);
            }
        });

        return items;
    }, [examData]);

    const filteredItems = tableItems.filter(
        (item) =>
            item.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.instruction?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const previewPages = useMemo(() => {
        const pages = [];
        const rawGroups = examData.question_groups || [];
        const groups = Array.isArray(rawGroups) ? rawGroups : Object.values(rawGroups);
        const rawStandalone = examData.standalone_questions || [];
        const standalone = Array.isArray(rawStandalone) ? rawStandalone : Object.values(rawStandalone);

        const combined = [
            ...groups.map(g => ({ ...g, itemType: 'group' })),
            ...standalone.map(q => ({ ...q, itemType: 'question' }))
        ].sort((a, b) => a.position - b.position);

        combined.forEach(item => {
            if (item.itemType === 'group') {
                pages.push({
                    type: 'group',
                    instruction: item.instruction,
                    section_type: item.section_type || null,
                    reading_text: item.reading_text,
                    audio_path: item.audio_path,
                    file_path: item.file_path,
                    questions: (item.questions || []).sort((a,b) => (a.position - b.position) || (a.number - b.number)).map(q => ({
                        id: q.id,
                        number: q.number,
                        type: q.type,
                        text: q.question_text || q.text,
                        audio_path: q.audio_path,
                        options: (q.options || []).map(o => ({ 
                            id: o.id || Math.random(), 
                            text: o.text || o.option_text || '', 
                            option_text: o.text || o.option_text || '',
                            is_correct: o.is_correct 
                        })),
                        kid_canvas: q.kid_canvas || null,
                    }))
                });
            } else {
                pages.push({
                    type: 'question',
                    questions: [{
                        id: item.id,
                        number: item.number,
                        skill_type: item.skill_type,
                        title: item.title,
                        type: item.type,
                        text: item.question_text || item.title || item.text,
                        description: item.description,
                        audio_path: item.audio_path,
                        question_pdf_path: item.question_pdf_path,
                        answer_sheet_pdf_path: item.answer_sheet_pdf_path,
                        min_words: item.min_words,
                        options: (item.options || []).map(o => ({ 
                            id: o.id || Math.random(), 
                            text: o.text || o.option_text || '', 
                            option_text: o.text || o.option_text || '',
                            is_correct: o.is_correct 
                        })),
                        kid_canvas: item.kid_canvas || null,
                    }]
                });
            }
        });
        return pages;
    }, [examData]);

    return {
        examData,
        // Modal states
        isSettingsOpen, setIsSettingsOpen,
        isQuestionModalOpen, setIsQuestionModalOpen,
        isGroupModalOpen, setIsGroupModalOpen,
        isPreviewOpen, setIsPreviewOpen,
        mediaModal, setMediaModal,
        previewPages,
        editingQuestion, editingGroup, targetGroupId,
        // Forms
        settingsForm, questionForm, groupForm,
        // Handlers
        handleSettingsSubmit, handleQuestionSubmit, handleGroupSubmit,
        handleDeleteExam, handleDeleteQuestion, handleDeleteGroup,
        // Modal openers
        openQuestionModal, openGroupModal, openMediaModal,
        // Table data
        searchQuery, setSearchQuery, filteredItems,
    };
}