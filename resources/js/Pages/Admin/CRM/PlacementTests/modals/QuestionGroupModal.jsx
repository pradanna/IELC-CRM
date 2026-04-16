import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import TextArea from '@/Components/ui/TextArea';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import FileInput from '@/Components/form/FileInput';
import { Music, FileText, BookOpen, Mic2, Headphones } from 'lucide-react';

const SECTION_TYPES = [
    {
        id: 'reading',
        label: 'Reading',
        desc: 'Passage & comprehension',
        icon: BookOpen,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        activeBg: 'bg-blue-50/50',
    },
    {
        id: 'listening',
        label: 'Listening',
        desc: 'Audio material & response',
        icon: Headphones,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-500',
        activeBg: 'bg-emerald-50/50',
    },
    {
        id: 'speaking',
        label: 'Speaking',
        desc: 'Oral task / prompt',
        icon: Mic2,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-500',
        activeBg: 'bg-violet-50/50',
    },
];

export default function QuestionGroupModal({ show, onClose, form, onSubmit, editingGroup, examCategory = 'General' }) {
    const isIELTS = examCategory === 'IELTS';

    return (
        <Modal show={show} onClose={onClose} maxWidth="4xl">
            <div className="p-8">
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                    {editingGroup
                        ? (isIELTS ? 'Edit Task Group' : 'Edit Question Group')
                        : (isIELTS ? 'New Task Group' : 'New Question Group')}
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                    {isIELTS
                        ? 'Tentukan tipe seksi dan tambahkan materi (teks/audio/file) untuk grup soal ini.'
                        : 'Group questions under a shared context (Reading / Listening)'}
                </p>

                <form onSubmit={onSubmit} className="space-y-5">

                    {/* Section Type — IELTS only */}
                    {isIELTS && (
                        <div>
                            <InputLabel value="Section Type" />
                            <div className="mt-2 grid grid-cols-3 gap-3">
                                {SECTION_TYPES.map((s) => {
                                    const isActive = form.data.section_type === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => form.setData('section_type', s.id)}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                                isActive
                                                    ? `${s.border} ${s.activeBg}`
                                                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isActive ? `${s.bg} ${s.color}` : 'bg-white text-slate-300'}`}>
                                                <s.icon size={20} />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-widest ${isActive ? s.color : 'text-slate-500'}`}>
                                                    {s.label}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                                    {s.desc}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <InputError message={form.errors.section_type} className="mt-1" />
                        </div>
                    )}

                    {/* Instruction */}
                    <div>
                        <InputLabel value={isIELTS ? 'Task Instruction / Prompt' : 'Primary Instruction'} />
                        <TextInput
                            required
                            className="mt-1"
                            value={form.data.instruction}
                            onChange={(e) => form.setData('instruction', e.target.value)}
                            placeholder={
                                isIELTS
                                    ? 'e.g., Listen to the audio and answer questions 1–5'
                                    : 'e.g., Read the following text and answer questions 1-5'
                            }
                        />
                        <InputError message={form.errors.instruction} className="mt-1" />
                    </div>

                    {/* Reading Text */}
                    <div>
                        <InputLabel value={isIELTS ? 'Passage / Reading Material (Optional)' : 'Context / Reading Material'} />
                        <TextArea
                            className="mt-1"
                            rows={8}
                            value={form.data.reading_text ?? ''}
                            onChange={(e) => form.setData('reading_text', e.target.value)}
                            placeholder="Enter reading passage or text context here..."
                        />
                        <InputError message={form.errors.reading_text} className="mt-1" />
                    </div>

                    {/* Audio + File */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <InputLabel value={isIELTS ? 'Audio Material (Listening)' : 'Group Audio (Listening)'} />
                            <FileInput
                                accept="audio/*"
                                value={form.data.media}
                                onChange={(file) => form.setData('media', file)}
                                placeholder="Upload audio file (MP3, WAV)"
                                icon={Music}
                                error={form.errors.media}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel value={isIELTS ? 'Attached Resource (PDF/DOCX)' : 'Reading Document (Optional)'} />
                            <FileInput
                                accept=".pdf,.doc,.docx"
                                value={form.data.reading_file}
                                onChange={(file) => form.setData('reading_file', file)}
                                placeholder="PDF or Word Document"
                                icon={FileText}
                                error={form.errors.reading_file}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <SecondaryButton type="button" onClick={onClose}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={form.processing}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            {form.processing ? 'Saving...' : editingGroup ? 'Update Group' : 'Save Group'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
