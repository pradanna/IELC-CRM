import React, { useEffect, useMemo } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import PremiumSearchableMultiSelect from '@/Components/PremiumSearchableMultiSelect';
import TextInput from '@/Components/TextInput';
import DatePicker from '@/Components/form/DatePicker';
import useClassScheduleCalculation from '../hooks/useClassScheduleCalculation';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import { X, GraduationCap, MapPin, Users, Calendar, Hash, Zap } from 'lucide-react';

export default function CreateEditClassModal({ isOpen, onClose, studyClass = null, branches = [], instructors = [] }) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        branch_id: '',
        instructor_id: '',
        start_session_date: '',
        end_session_date: '',
        total_meetings: 12,
        meetings_per_week: 2,
        current_session_number: 0,
        schedule_days: [],
    });

    // Automate calculations
    useClassScheduleCalculation(data, setData);

    const dayOptions = [
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' },
    ];

    useEffect(() => {
        if (studyClass) {
            setData({
                name: studyClass.name || '',
                branch_id: studyClass.branch_id || '',
                instructor_id: studyClass.instructor_id || '',
                start_session_date: studyClass.start_session_date || '',
                end_session_date: studyClass.end_session_date || '',
                total_meetings: studyClass.total_meetings || 12,
                meetings_per_week: studyClass.meetings_per_week || 2,
                schedule_days: studyClass.schedule_days || [],
                current_session_number: studyClass.current_session_number || 0,
            });
        } else {
            reset();
        }
        clearErrors();
    }, [studyClass, isOpen]);

    const branchOptions = useMemo(() => branches.map(b => ({ value: b.id, label: b.name })), [branches]);
    const instructorOptions = useMemo(() => instructors.map(i => ({ value: i.id, label: i.name })), [instructors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (studyClass) {
            patch(route('admin.academic.study-classes.update', studyClass.id), {
                onSuccess: () => onClose(),
                preserveScroll: true,
            });
        } else {
            post(route('admin.academic.study-classes.store'), {
                onSuccess: () => onClose(),
                preserveScroll: true,
            });
        }
    };

    return (
        <Modal show={isOpen} onClose={onClose} maxWidth="2xl">
            <div className="relative bg-white rounded-2xl">
                {/* Header */}
                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                {studyClass ? 'Edit Study Class' : 'Create New Class'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Academic Module</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="name" value="Class Identifier" className="text-[10px] font-black uppercase text-slate-400 ml-1" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full !rounded-xl !py-3 !px-4 border-slate-200 focus:border-red-500 transition-all font-bold text-sm"
                                placeholder="e.g. Paris & Co (Intermediate)"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <InputLabel value="Center Location" className="text-[10px] font-black uppercase text-slate-400 ml-1" />
                                <PremiumSearchableSelect
                                    options={branchOptions}
                                    value={data.branch_id}
                                    onChange={(val) => setData('branch_id', val)}
                                    placeholder="Select Branch"
                                    icon={MapPin}
                                />
                                <InputError message={errors.branch_id} />
                            </div>

                            <div className="space-y-1.5">
                                <InputLabel value="Assigned Instructor" className="text-[10px] font-black uppercase text-slate-400 ml-1" />
                                <PremiumSearchableSelect
                                    options={instructorOptions}
                                    value={data.instructor_id}
                                    onChange={(val) => setData('instructor_id', val)}
                                    placeholder="Assign Teacher"
                                    icon={Users}
                                />
                                <InputError message={errors.instructor_id} />
                            </div>
                        </div>
                    </div>

                    {/* Schedule & Metrics Card */}
                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1 bg-slate-200 text-slate-600 rounded-md">
                                <Zap className="w-3 h-3" />
                            </span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <InputLabel value="Total Sessions" className="text-[10px] font-black text-slate-400" />
                                <div className="relative">
                                    <TextInput
                                        type="number"
                                        value={data.total_meetings}
                                        onChange={(e) => setData('total_meetings', e.target.value)}
                                        className="w-full !rounded-xl !pl-10 !py-2.5 font-bold text-sm"
                                    />
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                                <InputError message={errors.total_meetings} />
                            </div>

                            <div className="space-y-1.5">
                                <InputLabel value="Meetings/Week" className="text-[10px] font-black text-slate-400" />
                                <div className="relative">
                                    <TextInput
                                        type="number"
                                        value={data.meetings_per_week}
                                        onChange={(e) => setData('meetings_per_week', e.target.value)}
                                        className="w-full !rounded-xl !pl-10 !py-2.5 font-bold text-sm"
                                    />
                                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                </div>
                                <InputError message={errors.meetings_per_week} />
                            </div>

                            <div className="space-y-1.5 col-span-1 md:col-span-1">
                                <InputLabel value="Weekly Days" className="text-[10px] font-black text-slate-400" />
                                <PremiumSearchableMultiSelect
                                    options={dayOptions}
                                    value={data.schedule_days}
                                    onChange={(val) => setData('schedule_days', val)}
                                    placeholder="Click to select days"
                                    className="w-full"
                                />
                                <InputError message={errors.schedule_days} />
                            </div>
                        </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <InputLabel value="Launch Date" className="text-[10px] font-black uppercase text-slate-400 ml-1" />
                            <DatePicker
                                value={data.start_session_date}
                                onChange={(val) => setData('start_session_date', val)}
                                placeholder="Select launch date"
                                inputClassName="!rounded-xl !py-2.5 font-bold text-sm"
                            />
                            <InputError message={errors.start_session_date} />
                        </div>
                        <div className="space-y-1.5">
                            <InputLabel value="Target Completion" className="text-[10px] font-black uppercase text-slate-400 ml-1" />
                            <DatePicker
                                value={data.end_session_date}
                                onChange={(val) => setData('end_session_date', val)}
                                placeholder="Select completion date"
                                inputClassName="!rounded-xl !py-2.5 font-bold text-sm"
                            />
                            <InputError message={errors.end_session_date} />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                        <SecondaryButton 
                            onClick={onClose} 
                            disabled={processing} 
                            className="bg-white !rounded-xl !py-2.5 !px-5 font-bold text-xs uppercase tracking-widest border-slate-200"
                        >
                            Back
                        </SecondaryButton>
                        <PrimaryButton 
                            disabled={processing} 
                            className="!rounded-xl !py-2.5 !px-8 !bg-red-600 hover:!bg-red-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 border-none"
                        >
                            {studyClass ? 'Save Changes' : 'Confirm & Launch'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
