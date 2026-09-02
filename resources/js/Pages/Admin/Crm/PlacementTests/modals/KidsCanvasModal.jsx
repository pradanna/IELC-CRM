import { useState } from "react";
import Modal from "@/Components/ui/Modal";
import TextInput from "@/Components/form/TextInput";
import TextArea from "@/Components/ui/TextArea";
import InputLabel from "@/Components/form/InputLabel";
import InputError from "@/Components/form/InputError";
import PrimaryButton from "@/Components/form/PrimaryButton";
import SecondaryButton from "@/Components/form/SecondaryButton";
import FileInput from "@/Components/form/FileInput";
import { Music, Eye, Palette, Save } from "lucide-react";
import KidsFreeformCanvasStudio from "../partials/KidsFreeformCanvasStudio";
import KidsFreeformCanvasQuestion from "@/Pages/Public/PlacementTest/components/KidsFreeformCanvasQuestion";

export default function KidsCanvasModal({
    show,
    onClose,
    form,
    onSubmit,
    editingQuestion,
    targetGroupId,
}) {
    const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);

    const modalTitle = editingQuestion
        ? "Edit Canvas Studio Anak"
        : targetGroupId
          ? "Tambah Canvas ke Theme Stage"
          : "Tambah Soal Canvas Interaktif Anak";

    return (
        <Modal show={show} onClose={onClose} maxWidth="full">
            <div className="p-8">
                <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200">
                            <Palette size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                                {modalTitle}
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Rancang area kanvas interaktif, letak target
                                drag & drop, dan gambar objek
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsLivePreviewOpen(true)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                        <Eye className="w-4 h-4" />
                        <span>Preview Tampilan Siswa</span>
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Instruction Statement */}
                    <div>
                        <InputLabel
                            value="Instruksi Soal untuk Anak"
                            className="font-bold"
                        />
                        <TextArea
                            required
                            className="mt-1.5"
                            rows={2}
                            value={form.data.question_text}
                            onChange={(e) =>
                                form.setData("question_text", e.target.value)
                            }
                            placeholder="Contoh: Tarik nama benda ke gambar yang sesuai..."
                        />
                        <InputError
                            message={form.errors.question_text}
                            className="mt-1"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Audio Guide */}
                        <div>
                            <InputLabel
                                value="Audio Panduan Suara (Opsional)"
                                className="font-bold"
                            />
                            <FileInput
                                accept="audio/*,video/*"
                                value={form.data.media}
                                onChange={(file) => form.setData("media", file)}
                                placeholder="Upload rekaman instruksi guru (MP3, WAV)"
                                icon={Music}
                                error={form.errors.media}
                                className="mt-1.5"
                            />
                        </div>

                        {/* Points */}
                        <div>
                            <InputLabel
                                value="Nilai / Bobot Poin per Dropzone"
                                className="font-bold"
                            />
                            <TextInput
                                type="number"
                                className="mt-1.5"
                                value={form.data.points}
                                onChange={(e) =>
                                    form.setData("points", e.target.value)
                                }
                                min={1}
                                required
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Tiap dropzone yang dicocokkan dengan benar akan
                                dikalikan dengan poin ini.
                            </p>
                            <InputError
                                message={form.errors.points}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Free-Form Canvas Studio */}
                    <div className="pt-2">
                        <InputLabel
                            value="Interactive Canvas Studio Builder"
                            className="font-black text-slate-800 mb-2"
                        />
                        <KidsFreeformCanvasStudio
                            key={editingQuestion ? editingQuestion.id : "new_canvas"}
                            value={form.data.canvas_data}
                            onChange={(canvas) =>
                                form.setData("canvas_data", canvas)
                            }
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsLivePreviewOpen(true)}
                            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                            <Eye className="w-4 h-4" />
                            <span>Preview Tampilan Siswa</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <SecondaryButton type="button" onClick={onClose}>
                                Tutup
                            </SecondaryButton>
                            
                            <button
                                type="button"
                                disabled={form.processing}
                                onClick={(e) => onSubmit(e, { keepOpen: true })}
                                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                title="Simpan perubahan data canvas saat ini tanpa menutup editor"
                            >
                                <Save className="w-4 h-4 text-amber-600" />
                                <span>{form.processing ? "Menyimpan..." : "Simpan Draft (Tetap di Canvas)"}</span>
                            </button>

                            <PrimaryButton
                                type="submit"
                                disabled={form.processing}
                                className="bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white"
                            >
                                {form.processing
                                    ? "Menyimpan..."
                                    : editingQuestion
                                      ? "Selesai & Simpan"
                                      : "Simpan & Selesai"}
                            </PrimaryButton>
                        </div>
                    </div>
                </form>
            </div>

            {/* Instant Live Student Preview Modal */}
            <Modal
                show={isLivePreviewOpen}
                onClose={() => setIsLivePreviewOpen(false)}
                maxWidth="6xl"
            >
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
                                Uji coba interaksi drag & drop kata dan ring
                                persis seperti yang akan dikerjakan oleh siswa.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsLivePreviewOpen(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                        Tutup Preview
                    </button>
                </div>

                <div className="p-6 bg-slate-50 overflow-y-auto max-h-[80vh]">
                    <KidsFreeformCanvasQuestion
                        question={{
                            id: "preview_q",
                            number: 1,
                            type: "drag_drop",
                            text:
                                form.data.question_text ||
                                "Placement Test Question",
                            options: [
                                {
                                    id: "preview_opt",
                                    option_text: JSON.stringify(
                                        form.data.canvas_data || {},
                                    ),
                                    text: JSON.stringify(
                                        form.data.canvas_data || {},
                                    ),
                                    is_correct: true,
                                },
                            ],
                        }}
                        value={null}
                        onChange={(val) => {
                            console.log("Preview Student Answers:", val);
                        }}
                        isReview={false}
                    />
                </div>
            </Modal>
        </Modal>
    );
}
