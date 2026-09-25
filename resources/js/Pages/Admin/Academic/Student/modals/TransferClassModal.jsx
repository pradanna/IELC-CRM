import React, { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { 
    ArrowRightLeft, 
    X, 
    Calendar, 
    BookOpen, 
    ArrowRight, 
    FileText, 
    AlertCircle,
    GraduationCap,
    Loader2,
    Calculator,
    Receipt,
    CheckCircle2
} from 'lucide-react';
import Button from '@/Components/ui/Button';
import DatePicker from '@/Components/form/DatePicker';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import TextArea from '@/Components/ui/TextArea';

export default function TransferClassModal({
    show,
    onClose,
    student,
    studyClassesList = [],
    initialFromClassId = null
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        from_study_class_id: '',
        to_study_class_id: '',
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
    });

    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Active classes of the student
    const studentActiveClasses = (student?.study_classes || []).filter(c => c && c.id);

    useEffect(() => {
        if (show && student) {
            const defaultFrom = initialFromClassId 
                || (studentActiveClasses.length > 0 ? studentActiveClasses[0].id : '');
            
            setData({
                from_study_class_id: defaultFrom,
                to_study_class_id: '',
                effective_date: new Date().toISOString().split('T')[0],
                reason: '',
            });
            setPreviewData(null);
            clearErrors();
        }
    }, [show, student, initialFromClassId]);

    // Live preview calculation when classes or effective date change
    useEffect(() => {
        if (show && student?.id && data.from_study_class_id && data.to_study_class_id) {
            let cancelled = false;
            setLoadingPreview(true);

            axios.get(route('admin.academic.students.transfer-preview', student.id), {
                params: {
                    from_study_class_id: data.from_study_class_id,
                    to_study_class_id: data.to_study_class_id,
                    effective_date: data.effective_date,
                }
            })
            .then(res => {
                if (!cancelled) {
                    setPreviewData(res.data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPreviewData(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingPreview(false);
                }
            });

            return () => {
                cancelled = true;
            };
        } else {
            setPreviewData(null);
        }
    }, [show, student?.id, data.from_study_class_id, data.to_study_class_id, data.effective_date]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!student) return;

        post(route('admin.academic.students.transfer-class', student.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreviewData(null);
                onClose();
            },
        });
    };

    if (!student) return null;

    const leadName = student.lead?.name || 'Siswa';
    const studentNumber = student.student_number || '';

    // Filter available target classes: exclude the selected source class
    const targetClassOptions = studyClassesList.filter(
        c => c.id !== data.from_study_class_id
    );

    const selectedFromClass = studentActiveClasses.find(c => c.id === data.from_study_class_id);
    const selectedToClass = studyClassesList.find(c => c.id === data.to_study_class_id);

    return (
        <Transition show={show} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-[110] overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-visible rounded-[32px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl border border-slate-100">
                                {/* Header */}
                                <div className="px-8 pt-8 pb-5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-red-50/50 via-slate-50/30 to-white">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                                            <ArrowRightLeft className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                                Pindah Kelas Siswa
                                            </Dialog.Title>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {studentNumber} • {leadName}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 rounded-xl transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                                    {/* Student active class notice */}
                                    {studentActiveClasses.length === 0 ? (
                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800">
                                            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                                            <div className="text-xs space-y-1">
                                                <p className="font-extrabold uppercase tracking-wide">Tidak Ada Kelas Aktif</p>
                                                <p className="font-medium text-amber-700">
                                                    Siswa ini saat ini belum terdaftar di kelas aktif manapun. Silakan daftarkan siswa terlebih dahulu dari menu manajemen kelas.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Source & Destination Class Visualizer */}
                                            <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-2.5">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Ringkasan Perpindahan
                                                </p>
                                                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">
                                                            Kelas Asal (Keluar)
                                                        </span>
                                                        <p className="text-xs font-black text-slate-800 truncate mt-0.5">
                                                            {selectedFromClass ? selectedFromClass.name : 'Pilih Kelas Asal'}
                                                        </p>
                                                    </div>
                                                    <div className="p-2 bg-slate-100 text-slate-400 rounded-lg shrink-0">
                                                        <ArrowRight size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-right">
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">
                                                            Kelas Baru (Masuk)
                                                        </span>
                                                        <p className="text-xs font-black text-slate-800 truncate mt-0.5">
                                                            {selectedToClass ? selectedToClass.name : 'Pilih Kelas Tujuan'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selection Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Source Class */}
                                                <div className="space-y-1.5">
                                                    <InputLabel htmlFor="from_study_class_id" value="Kelas Asal *" />
                                                    <select
                                                        id="from_study_class_id"
                                                        value={data.from_study_class_id}
                                                        onChange={(e) => setData('from_study_class_id', e.target.value)}
                                                        className="w-full bg-slate-50 border-slate-200 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10 rounded-xl py-3 px-3.5 text-xs font-bold text-slate-800 transition-all cursor-pointer"
                                                        required
                                                    >
                                                        <option value="" disabled>Pilih kelas saat ini...</option>
                                                        {studentActiveClasses.map((cls) => (
                                                            <option key={cls.id} value={cls.id}>
                                                                {cls.name} {cls.category ? `(${cls.category})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError message={errors.from_study_class_id} />
                                                </div>

                                                {/* Target Class */}
                                                <div className="space-y-1.5 relative z-20">
                                                    <InputLabel htmlFor="to_study_class_id" value="Kelas Tujuan Baru *" />
                                                    <PremiumSearchableSelect
                                                        value={data.to_study_class_id}
                                                        onChange={(val) => setData('to_study_class_id', val)}
                                                        options={targetClassOptions.map((cls) => ({
                                                            value: cls.id,
                                                            label: `${cls.name}${cls.category ? ` (${cls.category.toUpperCase()})` : ''}`,
                                                        }))}
                                                        placeholder="Cari & pilih kelas tujuan..."
                                                        error={!!errors.to_study_class_id}
                                                    />
                                                    <InputError message={errors.to_study_class_id} />
                                                </div>
                                            </div>

                                            {/* Effective Date */}
                                            <div className="space-y-1.5">
                                                <InputLabel htmlFor="effective_date" value="Tanggal Efektif Pindah" />
                                                <DatePicker
                                                    id="effective_date"
                                                    value={data.effective_date}
                                                    onChange={(val) => setData('effective_date', val)}
                                                    inputClassName="!py-3 !rounded-xl !border-slate-200 !text-xs !font-bold !bg-slate-50 focus:!bg-white focus:!border-red-500"
                                                    placeholder="Pilih tanggal efektif..."
                                                />
                                                <InputError message={errors.effective_date} />
                                            </div>

                                            {/* Real-time Calculation & Invoice Preview */}
                                            {loadingPreview && (
                                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center gap-2.5 text-slate-500">
                                                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                                    <span className="text-xs font-bold">Menghitung sisa sesi & selisih durasi kelas...</span>
                                                </div>
                                            )}

                                            {!loadingPreview && previewData && (
                                                <div className="p-4.5 bg-gradient-to-br from-slate-50 via-slate-50/50 to-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs transition-all animate-in fade-in duration-300">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                            <Calculator className="w-3.5 h-3.5 text-slate-500" />
                                                            Perhitungan Sisa Sesi & Durasi
                                                        </span>
                                                        {previewData.requires_invoice ? (
                                                            <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300/80 rounded-full flex items-center gap-1">
                                                                <Receipt className="w-3 h-3 text-amber-600" />
                                                                Diterbitkan Invoice Selisih
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-full flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                Bebas Biaya Tambahan
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Sessions comparison tiles */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                                                                Sisa di Kelas Asal
                                                            </span>
                                                            <p className="text-base font-black text-slate-800 mt-0.5">
                                                                {previewData.from_remaining} <span className="text-xs font-bold text-slate-500">Sesi</span>
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                                {previewData.from_class_name}
                                                            </p>
                                                        </div>

                                                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                                                                Sisa di Kelas Tujuan
                                                            </span>
                                                            <p className="text-base font-black text-slate-800 mt-0.5">
                                                                {previewData.to_remaining} <span className="text-xs font-bold text-slate-500">Sesi</span>
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                                {previewData.to_class_name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Invoice notification or confirmation banner */}
                                                    {previewData.requires_invoice ? (
                                                        <div className="p-3.5 bg-amber-500/10 border border-amber-300/80 rounded-xl space-y-2">
                                                            <div>
                                                                <p className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                                                                    <span>Kelas tujuan memiliki durasi lebih lama (+{previewData.difference_sessions} Sesi)</span>
                                                                </p>
                                                                <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                                                                    Siswa memiliki sisa <strong>{previewData.from_remaining} sesi</strong> di kelas asal, sedangkan kelas tujuan memerlukan <strong>{previewData.to_remaining} sesi</strong>. Sistem otomatis menerbitkan tagihan invoice selisih durasi ({previewData.difference_sessions} sesi).
                                                                </p>
                                                            </div>

                                                            <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                                                                <span className="text-[11px] font-bold text-amber-900">
                                                                    Nominal Invoice Selisih:
                                                                </span>
                                                                <span className="text-sm font-black text-amber-700">
                                                                    Rp {Number(previewData.invoice_amount).toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 bg-emerald-500/10 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800">
                                                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                                            <p className="text-xs font-bold text-emerald-900 leading-tight">
                                                                Durasi kelas tujuan ({previewData.to_remaining} sesi) tidak lebih lama dari sisa kelas asal ({previewData.from_remaining} sesi). Tidak ada tagihan invoice tambahan.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Reason / Notes */}
                                            <div className="space-y-1.5">
                                                <InputLabel htmlFor="reason" value="Alasan / Catatan Pemindahan" />
                                                <TextArea
                                                    id="reason"
                                                    value={data.reason}
                                                    onChange={(e) => setData('reason', e.target.value)}
                                                    placeholder="Contoh: Menyesuaikan jadwal sekolah baru, naik level materi..."
                                                    className="w-full min-h-[75px] text-xs"
                                                />
                                                <InputError message={errors.reason} />
                                            </div>
                                        </>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                                        <Button
                                            type="button"
                                            onClick={onClose}
                                            variant="ghost"
                                            className="!text-slate-500 hover:!text-slate-700 text-xs font-black uppercase tracking-wider"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing || studentActiveClasses.length === 0 || !data.from_study_class_id || !data.to_study_class_id}
                                            className="!bg-red-600 hover:!bg-red-700 !text-white px-6 py-2.5 rounded-xl shadow-lg shadow-red-600/20 text-xs font-black uppercase tracking-wider flex items-center gap-2"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Memproses...
                                                </>
                                            ) : previewData?.requires_invoice ? (
                                                <>
                                                    <Receipt className="w-4 h-4" />
                                                    Pindahkan & Terbitkan Invoice
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                    Pindahkan Kelas
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
