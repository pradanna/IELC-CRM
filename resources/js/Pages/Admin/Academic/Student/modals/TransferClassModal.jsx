import React, { useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { 
    ArrowRightLeft, 
    X, 
    Calendar, 
    BookOpen, 
    ArrowRight, 
    FileText, 
    AlertCircle,
    GraduationCap,
    Loader2
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
            clearErrors();
        }
    }, [show, student, initialFromClassId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!student) return;

        post(route('admin.academic.students.transfer-class', student.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!student) return null;

    const leadName = student.lead?.name || 'Siswa';
    const studentNumber = student.student_number || '';
    const branchName = student.lead?.branch?.name || 'Semua Cabang';

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

                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                                            <div className="p-4.5 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Ringkasan Perpindahan
                                                </p>
                                                <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
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
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

                                            {/* Reason / Notes */}
                                            <div className="space-y-1.5">
                                                <InputLabel htmlFor="reason" value="Alasan / Catatan Pemindahan" />
                                                <TextArea
                                                    id="reason"
                                                    value={data.reason}
                                                    onChange={(e) => setData('reason', e.target.value)}
                                                    placeholder="Contoh: Menyesuaikan jadwal sekolah baru, naik level materi..."
                                                    className="w-full min-h-[90px] text-xs"
                                                />
                                                <InputError message={errors.reason} />
                                            </div>
                                        </>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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
