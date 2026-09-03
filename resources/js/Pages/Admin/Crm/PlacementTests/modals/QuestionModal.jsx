import { useState, useEffect } from 'react';
import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import TextArea from '@/Components/ui/TextArea';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import FileInput from '@/Components/form/FileInput';
import { AlignLeft, CheckCircle2, Music, Type, FileUp, ListChecks, FileText, Paperclip, Palette, Image as ImageIcon, Eye } from 'lucide-react';
import KidsCanvasBuilder from '../partials/KidsCanvasBuilder';
import KidsImageCanvasBuilder from '../partials/KidsImageCanvasBuilder';
import KidsFreeformCanvasStudio from '../partials/KidsFreeformCanvasStudio';
import KidsFreeformCanvasQuestion from '@/Pages/Public/PlacementTest/components/KidsFreeformCanvasQuestion';

export default function QuestionModal({ show, onClose, form, onSubmit, editingQuestion, targetGroupId, examCategory = 'General' }) {
    const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
    const isIELTS = examCategory === 'IELTS';
    const modalTitle = editingQuestion
        ? (isIELTS ? 'Edit Task Prompt' : 'Edit Question')
        : targetGroupId
        ? (isIELTS ? 'Add Grouped Task' : 'Add Grouped Question')
        : (isIELTS ? 'Add Task Statement' : 'Add Standalone Question');

    useEffect(() => {
        if (isIELTS && form.data.type === 'mcq' && show) {
            form.setData('type', 'text');
        } else if (examCategory === 'Kids' && form.data.type === 'mcq' && show && !editingQuestion) {
            form.setData('type', 'drag_drop');
        }
    }, [isIELTS, examCategory, form.data.type, show, editingQuestion]);

    const isKidsCanvas = form.data.type === 'drag_drop' || examCategory === 'Kids';

    return (
        <Modal show={show} onClose={onClose} maxWidth={isKidsCanvas ? "full" : "4xl"}>
            <div className="p-8">
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">{modalTitle}</h2>
                <p className="text-xs text-slate-400 mb-6">Configure assessment item parameters</p>

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Question Type */}
                    <div>
                        <InputLabel value="Question Type" className="flex items-center gap-1.5" />
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { id: 'mcq', label: 'Multiple Choice', icon: ListChecks, desc: 'Single correct answer', hide: isIELTS },
                                { id: 'drag_drop', label: 'Kids Drag & Drop', icon: Palette, desc: 'Interactive Canvas', hide: isIELTS },
                                { id: 'text', label: isIELTS ? 'Task / Instruction' : 'Text Essay', icon: isIELTS ? AlignLeft : Type, desc: isIELTS ? 'Instructional prompt' : 'Written response', hide: !isIELTS },
                                { id: 'file', label: isIELTS ? 'File Prompt' : 'File Upload', icon: FileUp, desc: isIELTS ? 'Attachment instruction' : 'Assignment/document', hide: !isIELTS },
                            ].filter(t => !t.hide).map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => form.setData('type', t.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                                        form.data.type === t.id
                                            ? 'border-red-500 bg-red-50/50'
                                            : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                    }`}
                                >
                                    <t.icon size={20} className={form.data.type === t.id ? 'text-red-500' : 'text-slate-400'} />
                                    <div className="text-center">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${form.data.type === t.id ? 'text-red-900' : 'text-slate-500'}`}>{t.label}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{t.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question Text */}
                    <div>
                        <InputLabel value={isIELTS ? "Task / Prompt Detail" : "Question Statement"} className="flex items-center gap-1.5">
                            <AlignLeft size={12} className="inline mr-1" /> {isIELTS ? "Detail" : "Statement"}
                        </InputLabel>
                        <TextArea
                            required
                            className="mt-1"
                            rows={3}
                            value={form.data.question_text}
                            onChange={(e) => form.setData('question_text', e.target.value)}
                            placeholder="Enter the question text here..."
                        />
                        <InputError message={form.errors.question_text} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Audio / File */}
                        <div>
                            <InputLabel value={isIELTS ? "Task Material / File Resource" : "Audio Resource (Optional)"} />
                            <FileInput
                                accept={isIELTS ? "*" : "audio/*,video/*"}
                                value={form.data.media}
                                onChange={(file) => form.setData('media', file)}
                                placeholder={isIELTS ? "Upload task material (PDF, ZIP, Audio, etc.)" : "Upload audio file"}
                                icon={isIELTS ? Paperclip : Music}
                                error={form.errors.media}
                                className="mt-1"
                            />
                        </div>

                        {/* Points */}
                        <div>
                            <InputLabel value="Point Value" />
                            <TextInput
                                type="number"
                                className="mt-1"
                                value={form.data.points}
                                onChange={(e) => form.setData('points', e.target.value)}
                                min={1}
                            />
                            <InputError message={form.errors.points} className="mt-1" />
                        </div>
                    </div>

                    {/* Options / Free-Form Canvas Studio for Kids Drag & Drop */}
                    {form.data.type === 'drag_drop' && !isIELTS && (
                        <KidsFreeformCanvasStudio
                            key={editingQuestion ? editingQuestion.id : "new_canvas"}
                            value={form.data.canvas_data}
                            onChange={(canvas) => form.setData('canvas_data', canvas)}
                        />
                    )}

                    {form.data.type === 'mcq' && !isIELTS && (
                        <div>
                            <InputLabel value="Response Options" />
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {form.data.options.map((option, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                            form.data.correct_answer === idx
                                                ? 'border-emerald-500 bg-emerald-50/50'
                                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => form.setData('correct_answer', idx)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all font-black text-xs ${
                                                form.data.correct_answer === idx
                                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                                    : 'bg-white border-slate-200 text-slate-400 hover:border-red-400'
                                            } active:scale-90`}
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </button>
                                        <input
                                            required={form.data.type === 'mcq'}
                                            type="text"
                                            value={option}
                                            onChange={(e) => {
                                                const newOpts = [...form.data.options];
                                                newOpts[idx] = e.target.value;
                                                form.setData('options', newOpts);
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-slate-700 placeholder:text-slate-300 outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                            <InputError message={form.errors.options} className="mt-1" />
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        {isKidsCanvas && (
                            <button
                                type="button"
                                onClick={() => setIsLivePreviewOpen(true)}
                                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs"
                            >
                                <Eye className="w-4 h-4" />
                                <span>Preview Tampilan Siswa</span>
                            </button>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                            <SecondaryButton type="button" onClick={onClose}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={form.processing} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                                {form.processing ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>

            {/* Instant Live Student Preview Modal */}
            <Modal show={isLivePreviewOpen} onClose={() => setIsLivePreviewOpen(false)} maxWidth="full">
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                            <Eye className="w-4 h-4" />
                        </span>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">
                                Live Student Exam Preview
                            </h3>
                            <p className="text-[10px] text-slate-400">
                                Uji coba interaksi drag & drop kata dan ring persis seperti yang akan dikerjakan oleh siswa.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsLivePreviewOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                    >
                        Tutup Preview
                    </button>
                </div>

                <div className="p-6 bg-slate-50 overflow-y-auto max-h-[90vh]">
                    <KidsFreeformCanvasQuestion
                        question={{
                            id: 'preview_q',
                            number: 1,
                            type: 'drag_drop',
                            text: form.data.question_text || 'Placement Test Question',
                            options: [
                                {
                                    id: 'preview_opt',
                                    option_text: JSON.stringify(form.data.canvas_data || {}),
                                    text: JSON.stringify(form.data.canvas_data || {}),
                                    is_correct: true,
                                }
                            ]
                        }}
                        value={null}
                        onChange={(val) => {
                            console.log('Preview Student Answers:', val);
                        }}
                        isReview={false}
                    />
                </div>
            </Modal>
        </Modal>
    );
}
