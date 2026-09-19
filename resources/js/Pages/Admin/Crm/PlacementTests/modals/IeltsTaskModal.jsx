import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import RichTextEditor from '@/Components/ui/RichTextEditor';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import FileInput from '@/Components/form/FileInput';
import { Headphones, BookOpen, PenTool, Mic, FileText, Music, Clock } from 'lucide-react';

const SKILL_TYPES = [
    { id: 'listening', label: 'Listening', icon: Headphones, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'reading', label: 'Reading', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'writing', label: 'Writing', icon: PenTool, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'speaking', label: 'Speaking', icon: Mic, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export default function IeltsTaskModal({ show, onClose, form, onSubmit, editingQuestion }) {
    const currentSkill = form.data.skill_type || 'writing';

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                            {editingQuestion ? 'Edit IELTS Task' : 'Tambah IELTS Task'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Konfigurasi materi & lampiran PDF/Audio per modul IELTS</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Skill Type Picker */}
                    <div>
                        <InputLabel value="Pilih Modul IELTS" className="font-bold" />
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {SKILL_TYPES.map((s) => {
                                const Icon = s.icon;
                                const isSelected = currentSkill === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => form.setData('skill_type', s.id)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                            isSelected
                                                ? `${s.color} ring-2 ring-indigo-500/20 font-black`
                                                : 'border-slate-100 bg-slate-50/60 text-slate-600 hover:border-slate-200 font-semibold'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        <span className="text-xs">{s.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Task Title */}
                    <div>
                        <InputLabel value="Judul Task" className="font-bold" />
                        <TextInput
                            required
                            className="mt-1.5"
                            value={form.data.title || ''}
                            onChange={(e) => form.setData('title', e.target.value)}
                            placeholder={
                                currentSkill === 'listening' ? 'Contoh: Section 1-4 Listening Test' :
                                currentSkill === 'reading' ? 'Contoh: Academic Reading Passages 1-3' :
                                currentSkill === 'writing' ? 'Contoh: Writing Task 1 & Task 2' :
                                'Contoh: Speaking Interview & Discussion'
                            }
                        />
                        <InputError message={form.errors.title} className="mt-1" />
                    </div>

                    {/* Task Description / Instructions (RichText WYSIWYG Editor) */}
                    <div>
                        <InputLabel value="Deskripsi & Perintah Lengkap Task (Rich Text WYSIWYG)" className="font-bold mb-1.5" />
                        <RichTextEditor
                            value={form.data.description || ''}
                            onChange={(val) => form.setData('description', val)}
                            placeholder={
                                currentSkill === 'speaking'
                                    ? 'Tuliskan topik speaking, format pertanyaan wawancara (Part 1, 2, 3), dan instruksi untuk guru...'
                                    : 'Tuliskan instruksi pengerjaan lengkap, format jawaban, panduan alokasi waktu, dll...'
                            }
                            minHeight="160px"
                        />
                        <InputError message={form.errors.description} className="mt-1" />
                    </div>

                    {/* Skill Specific File Uploads */}
                    {currentSkill === 'listening' && (
                        <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-4">
                            <h4 className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Headphones size={14} /> Berkas Khusus Listening
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <InputLabel value="Audio MP3 Soal" className="text-xs font-bold" />
                                    <FileInput
                                        accept="audio/*"
                                        value={form.data.audio}
                                        onChange={(file) => form.setData('audio', file)}
                                        placeholder="File MP3"
                                        icon={Music}
                                        error={form.errors.audio}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="PDF Buku Soal" className="text-xs font-bold" />
                                    <FileInput
                                        accept=".pdf"
                                        value={form.data.question_pdf}
                                        onChange={(file) => form.setData('question_pdf', file)}
                                        placeholder="Buku Soal PDF"
                                        icon={FileText}
                                        error={form.errors.question_pdf}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="PDF Answer Sheet" className="text-xs font-bold" />
                                    <FileInput
                                        accept=".pdf"
                                        value={form.data.answer_sheet_pdf}
                                        onChange={(file) => form.setData('answer_sheet_pdf', file)}
                                        placeholder="Lembar Jawab PDF"
                                        icon={FileText}
                                        error={form.errors.answer_sheet_pdf}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentSkill === 'reading' && (
                        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
                            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                <BookOpen size={14} /> Berkas Khusus Reading
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="PDF Buku Bacaan & Soal" className="text-xs font-bold" />
                                    <FileInput
                                        accept=".pdf"
                                        value={form.data.question_pdf}
                                        onChange={(file) => form.setData('question_pdf', file)}
                                        placeholder="Passage Soal PDF"
                                        icon={FileText}
                                        error={form.errors.question_pdf}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="PDF Answer Sheet" className="text-xs font-bold" />
                                    <FileInput
                                        accept=".pdf"
                                        value={form.data.answer_sheet_pdf}
                                        onChange={(file) => form.setData('answer_sheet_pdf', file)}
                                        placeholder="Lembar Jawab PDF"
                                        icon={FileText}
                                        error={form.errors.answer_sheet_pdf}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentSkill === 'writing' && (
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-4">
                            <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                <PenTool size={14} /> Berkas Khusus Writing
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="PDF Lembar Soal / Grafik Diagram" className="text-xs font-bold" />
                                    <FileInput
                                        accept=".pdf,image/*"
                                        value={form.data.question_pdf}
                                        onChange={(file) => form.setData('question_pdf', file)}
                                        placeholder="Upload PDF Soal"
                                        icon={FileText}
                                        error={form.errors.question_pdf}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Minimal Jumlah Kata (Opsional)" className="text-xs font-bold" />
                                    <TextInput
                                        type="number"
                                        className="mt-1"
                                        value={form.data.min_words || ''}
                                        onChange={(e) => form.setData('min_words', e.target.value)}
                                        placeholder="Misal: 250"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Duration & Band Points */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Alokasi Waktu (Menit)" className="font-bold flex items-center gap-1.5">
                                <Clock size={13} className="text-indigo-600" />
                                <span>Durasi Task</span>
                            </InputLabel>
                            <TextInput
                                type="number"
                                className="mt-1.5"
                                value={form.data.duration_minutes || ''}
                                onChange={(e) => form.setData('duration_minutes', e.target.value)}
                                placeholder="Contoh: 30"
                            />
                        </div>

                        <div>
                            <InputLabel value="Maksimal Skor / Band Score" className="font-bold" />
                            <TextInput
                                type="number"
                                step="0.5"
                                className="mt-1.5"
                                value={form.data.max_score || '9.0'}
                                onChange={(e) => form.setData('max_score', e.target.value)}
                                min={0}
                                
                                required
                            />
                            <InputError message={form.errors.max_score} className="mt-1" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <SecondaryButton type="button" onClick={onClose}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white">
                            {form.processing ? 'Menyimpan...' : editingQuestion ? 'Update Task IELTS' : 'Simpan Task IELTS'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}