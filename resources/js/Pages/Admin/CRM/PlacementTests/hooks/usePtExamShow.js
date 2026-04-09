import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';

export function usePtExamShow(examData) {
    // UI States
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [mediaModal, setMediaModal] = useState({ show: false, url: null, type: 'audio' });
    const [searchQuery, setSearchQuery] = useState('');
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [targetGroupId, setTargetGroupId] = useState(null);

    // Forms
    const settingsForm = useForm({
        title: examData.title,
        description: examData.description,
        duration_minutes: examData.duration_minutes,
        is_active: examData.is_active,
    });

    const questionForm = useForm({
        pt_question_group_id: null,
        question_text: '',
        points: 1,
        options: ['', '', '', ''],
        correct_answer: 0,
        media: null,
    });

    const groupForm = useForm({
        instruction: '',
        reading_text: '',
        media: null,
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
        const url = editingQuestion
            ? route('admin.placement-tests.questions.update', [examData.id, editingQuestion.id])
            : route('admin.placement-tests.questions.store', examData.id);

        questionForm.post(url, {
            onSuccess: () => {
                setIsQuestionModalOpen(false);
                questionForm.reset();
                setEditingQuestion(null);
            },
        });
    };

    const handleGroupSubmit = (e) => {
        e.preventDefault();
        const url = editingGroup
            ? route('admin.placement-tests.question-groups.update', [examData.id, editingGroup.id])
            : route('admin.placement-tests.question-groups.store', examData.id);

        groupForm.post(url, {
            onSuccess: () => {
                setIsGroupModalOpen(false);
                groupForm.reset();
                setEditingGroup(null);
            },
        });
    };

    const handleDeleteQuestion = (id) => {
        if (confirm('Delete this question?')) {
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
        setTargetGroupId(group?.id || null);
        if (q) {
            setEditingQuestion(q);
            questionForm.setData({
                pt_question_group_id: q.pt_question_group_id,
                question_text: q.question_text,
                points: q.points,
                options: q.options.map((o) => o.text),
                correct_answer: q.options.findIndex((o) => o.is_correct),
                media: null,
            });
        } else {
            setEditingQuestion(null);
            questionForm.reset();
            questionForm.setData('pt_question_group_id', group?.id || null);
        }
        setIsQuestionModalOpen(true);
    };

    const openGroupModal = (g = null) => {
        if (g) {
            setEditingGroup(g);
            groupForm.setData({
                instruction: g.instruction,
                reading_text: g.reading_text,
                media: null,
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
        const groups = examData.question_groups || [];
        const standalone = examData.standalone_questions || [];

        const combined = [
            ...groups.map((g) => ({ ...g, _type: 'group' })),
            ...standalone.map((q) => ({ ...q, _type: 'question' })),
        ].sort((a, b) => a.position - b.position);

        combined.forEach((item) => {
            if (item._type === 'group') {
                items.push({ ...item, isGroupHeader: true });
                (item.questions || []).sort((a, b) => (a.position - b.position) || (a.number - b.number)).forEach((q) => {
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
            item.instruction?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const previewPages = useMemo(() => {
        const pages = [];
        const groups = examData.question_groups || [];
        const standalone = examData.standalone_questions || [];

        const combined = [
            ...groups.map(g => ({ ...g, itemType: 'group' })),
            ...standalone.map(q => ({ ...q, itemType: 'question' }))
        ].sort((a, b) => a.position - b.position);

        combined.forEach(item => {
            if (item.itemType === 'group') {
                pages.push({
                    type: 'group',
                    instruction: item.instruction,
                    reading_text: item.reading_text,
                    audio_path: item.audio_path,
                    questions: (item.questions || []).sort((a,b) => (a.position - b.position) || (a.number - b.number)).map(q => ({
                        id: q.id,
                        number: q.number,
                        text: q.question_text,
                        audio_path: q.audio_path,
                        options: (q.options || []).map(o => ({ id: o.id, text: o.option_text, is_correct: o.is_correct }))
                    }))
                });
            } else {
                pages.push({
                    type: 'question',
                    questions: [{
                        id: item.id,
                        number: item.number,
                        text: item.question_text,
                        audio_path: item.audio_path,
                        options: (item.options || []).map(o => ({ id: o.id, text: o.option_text, is_correct: o.is_correct }))
                    }]
                });
            }
        });
        return pages;
    }, [examData]);

    return {
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
        handleDeleteQuestion, handleDeleteGroup,
        // Modal openers
        openQuestionModal, openGroupModal, openMediaModal,
        // Table data
        searchQuery, setSearchQuery, filteredItems,
    };
}
