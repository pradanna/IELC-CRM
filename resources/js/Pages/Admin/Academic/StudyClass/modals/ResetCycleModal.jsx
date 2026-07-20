import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import DatePicker from '@/Components/form/DatePicker';
import useClassScheduleCalculation from '../hooks/useClassScheduleCalculation';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PremiumFormGroup from '@/Components/PremiumFormGroup';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import { X, RefreshCw, Calendar, BookOpen } from 'lucide-react';

export default function ResetCycleModal({ isOpen, onClose, studyClass }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        start_session_date: '',
        end_session_date: '',
        total_meetings: 24,
        schedule_days: [],
        meetings_per_week: 2,
    });

    // Automatically calculate end_session_date based on schedule
    useClassScheduleCalculation(data, setData);

    const calculateNextStartDate = (endSessionDateStr, scheduleDays) => {
        if (!endSessionDateStr || !Array.isArray(scheduleDays) || scheduleDays.length === 0) {
            return '';
        }
        try {
            const date = new Date(endSessionDateStr);
            // Start checking from the day after the class ended
            for (let i = 1; i <= 7; i++) {
                const next = new Date(date);
                next.setDate(date.getDate() + i);
                const dayName = next.toLocaleDateString('en-US', { weekday: 'long' });
                if (scheduleDays.includes(dayName)) {
                    return next.toISOString().split('T')[0];
                }
            }
            // Fallback: next day
            const fallback = new Date(date);
            fallback.setDate(fallback.getDate() + 1);
            return fallback.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    useEffect(() => {
        if (studyClass && isOpen) {
            const initialStartDate = calculateNextStartDate(studyClass.end_session_date, studyClass.schedule_days);
            setData({
                start_session_date: initialStartDate,
                end_session_date: '', // Will be calculated by useClassScheduleCalculation automatically
                total_meetings: studyClass.total_meetings || 24,
                schedule_days: studyClass.schedule_days || [],
                meetings_per_week: studyClass.meetings_per_week || 2,
            });
        } else {
            reset();
        }
        clearErrors();
    }, [studyClass, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!studyClass) return;

        post(route('admin.academic.study-classes.reset-cycle', studyClass.id), {
            onSuccess: () => onClose(),
            preserveScroll: true,
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="lg">
            <div className="relative bg-white rounded-2xl">
                {/* Header */}
                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                            <RefreshCw className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                Mulai Sesi / Cycle Baru
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                Kelas: {studyClass?.name} (Siklus #{studyClass?.current_session_number})
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100/60 space-y-2">
                        <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wide flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Informasi Sesi
                        </p>
                        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                            Tindakan ini akan mengakhiri Siklus #{studyClass?.current_session_number} dan memulai Siklus #{studyClass ? studyClass.current_session_number + 1 : 1}. Semua siswa terdaftar yang aktif akan otomatis dipindahkan ke siklus baru.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Start Session Date */}
                        <PremiumFormGroup
                            label="Tanggal Mulai Sesi Baru"
                            icon={Calendar}
                            error={errors.start_session_date}
                        >
                            <DatePicker
                                value={data.start_session_date}
                                onChange={(val) => setData('start_session_date', val)}
                                className="w-full"
                                placeholder="Pilih tanggal mulai kelas..."
                            />
                        </PremiumFormGroup>

                        {/* End Session Date */}
                        <PremiumFormGroup
                            label="Tanggal Selesai Sesi Baru (Auto)"
                            icon={Calendar}
                            error={errors.end_session_date}
                            helper="Dihitung otomatis berdasarkan total pertemuan dan hari jadwal kelas"
                        >
                            <DatePicker
                                value={data.end_session_date}
                                onChange={(val) => setData('end_session_date', val)}
                                className="w-full font-bold text-slate-800"
                                placeholder="Pilih tanggal selesai..."
                            />
                        </PremiumFormGroup>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <SecondaryButton type="button" onClick={onClose}>
                            Batal
                        </SecondaryButton>
                        <PrimaryButton 
                            type="submit" 
                            disabled={processing}
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/10"
                        >
                            {processing ? 'Menyimpan...' : 'Mulai Siklus Baru'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
