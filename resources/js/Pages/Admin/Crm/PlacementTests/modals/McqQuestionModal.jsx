import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import TextArea from '@/Components/ui/TextArea';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import FileInput from '@/Components/form/FileInput';
import { AlignLeft, ListChecks, Music } from 'lucide-react';

export default function McqQuestionModal({ show, onClose, form, onSubmit, editingQuestion, targetGroupId }) {
    const modalTitle = editingQuestion
        ? 'Edit Pertanyaan'
        : targetGroupId
        ? 'Tambah Soal ke Group'
        : 'Tambah Soal';

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
                        <ListChecks size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">{modalTitle}</h2>
                        <p className="text-xs text-slate-400 mt-1">Konfigurasi pertanyaan dan kunci jawaban</p>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Question Text */}
                    <div>
                        <InputLabel value="Teks Pertanyaan" className="flex items-center gap-1.5 font-bold">
                            <AlignLeft size={13} className="text-blue-600" />
                            <span>Pertanyaan / Kalimat Soal</span>
                        </InputLabel>
                        <TextArea
                            required
                            className="mt-1.5"
                            rows={3}
                            value={form.data.question_text}
                            onChange={(e) => form.setData('question_text', e.target.value)}
                            placeholder="Tuliskan pertanyaan di sini..."
                        />
                        <InputError message={form.errors.question_text} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Audio File */}
                        <div>
                            <InputLabel value="Audio Listening (Opsional)" className="font-bold" />
                            <FileInput
                                accept="audio/*,video/*"
                                value={form.data.media}
                                onChange={(file) => form.setData('media', file)}
                                placeholder="Upload audio file (MP3, WAV)"
                                icon={Music}
                                error={form.errors.media}
                                className="mt-1.5"
                            />
                        </div>

                        {/* Points */}
                        <div>
                            <InputLabel value="Nilai / Bobot Poin" className="font-bold" />
                            <TextInput
                                type="number"
                                className="mt-1.5"
                                value={form.data.points}
                                onChange={(e) => form.setData('points', e.target.value)}
                                min={1}
                                required
                            />
                            <InputError message={form.errors.points} className="mt-1" />
                        </div>
                    </div>

                    {/* Response Options */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <InputLabel value="Pilihan Jawaban (Klik huruf untuk menetapkan Kunci Jawaban Benar)" className="font-bold" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(form.data.options || ['', '', '', '']).map((option, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                        form.data.correct_answer === idx
                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                            : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => form.setData('correct_answer', idx)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all font-black text-xs cursor-pointer ${
                                            form.data.correct_answer === idx
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600'
                                        } active:scale-95`}
                                        title="Jadikan Kunci Jawaban Benar"
                                    >
                                        {String.fromCharCode(65 + idx)}
                                    </button>
                                    <input
                                        required
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                            const newOpts = [...(form.data.options || ['', '', '', ''])];
                                            newOpts[idx] = e.target.value;
                                            form.setData('options', newOpts);
                                        }}
                                        placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                                        className="flex-1 bg-transparent border-none text-sm font-semibold focus:ring-0 p-0 text-slate-800 placeholder:text-slate-300 outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        <InputError message={form.errors.options} className="mt-1" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <SecondaryButton type="button" onClick={onClose}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={form.processing} className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                            {form.processing ? 'Menyimpan...' : editingQuestion ? 'Update Soal' : 'Simpan Soal'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
