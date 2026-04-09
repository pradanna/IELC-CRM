import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import TextArea from '@/Components/ui/TextArea';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import { AlignLeft, CheckCircle2, Music } from 'lucide-react';

export default function QuestionModal({ show, onClose, form, onSubmit, editingQuestion, targetGroupId }) {
    const modalTitle = editingQuestion
        ? 'Edit Question'
        : targetGroupId
        ? 'Add Grouped Question'
        : 'Add Standalone Question';

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <div className="p-8">
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">{modalTitle}</h2>
                <p className="text-xs text-slate-400 mb-6">Configure assessment item parameters</p>

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Question Text */}
                    <div>
                        <InputLabel value="Question Statement" className="flex items-center gap-1.5">
                            <AlignLeft size={12} className="inline mr-1" /> Question Statement
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
                        {/* Audio */}
                        <div>
                            <InputLabel value="Audio Resource (Optional)" />
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => form.setData('media', e.target.files[0])}
                                className="mt-1 block w-full text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200 p-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
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

                    {/* Options */}
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
                                        required
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

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <SecondaryButton type="button" onClick={onClose}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={form.processing} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                            {form.processing ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
