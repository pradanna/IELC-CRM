import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import TextInput from '@/Components/TextInput';
import DatePicker from '@/Components/form/DatePicker';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import PremiumSearchableMultiSelect from '@/Components/PremiumSearchableMultiSelect';
import PremiumFormGroup from '@/Components/PremiumFormGroup';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import { calculateCompletionDate } from '../../Academic/StudyClass/hooks/useClassScheduleCalculation';
import { GraduationCap, X, MapPin, Users, Zap, Hash, Loader2 } from 'lucide-react';

export default function CreateClassQuickModal({
    isOpen,
    onClose,
    onCreated,
    lead = null,
    student = null,
    priceMasters = [],
    branches: propBranches = [],
    instructors: propInstructors = [],
    leadTypes: propLeadTypes = [],
    defaultStartDate = '',
}) {
    const { auth, branches: pageBranches = [] } = usePage().props;

    const [branches, setBranches] = useState(propBranches);
    const [instructors, setInstructors] = useState(propInstructors);
    const [leadTypes, setLeadTypes] = useState(propLeadTypes);
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const normalizedBranches = useMemo(() => {
        let list = [];
        if (branches && branches.length > 0) list = branches;
        else if (propBranches && propBranches.length > 0) list = propBranches;
        else if (pageBranches) {
            if (Array.isArray(pageBranches)) list = pageBranches;
            else if (pageBranches.data && Array.isArray(pageBranches.data)) list = pageBranches.data;
        }
        return list;
    }, [branches, propBranches, pageBranches]);

    const userBranchId = useMemo(() => {
        return auth?.user?.branch_id
            || auth?.user?.branch?.id
            || auth?.user?.frontdesk?.branch_id
            || auth?.user?.finance?.branch_id
            || auth?.user?.marketing?.branch_id
            || '';
    }, [auth]);

    const [form, setForm] = useState({
        name: '',
        category: 'private',
        type: 'offline',
        branch_id: '',
        instructor_id: '',
        price_master_id: '',
        start_session_date: '',
        end_session_date: '',
        total_meetings: 36,
        meetings_per_week: 2,
        schedule_days: ['Monday', 'Wednesday'],
        status: 'active',
    });

    // Fetch master options if not loaded
    useEffect(() => {
        if (!isOpen) return;

        if (branches.length === 0 || instructors.length === 0) {
            setLoadingData(true);
            axios.get(route('admin.academic.study-classes.form-data'))
                .then(res => {
                    if (res.data.branches) setBranches(res.data.branches);
                    if (res.data.instructors) setInstructors(res.data.instructors);
                    if (res.data.leadTypes) setLeadTypes(res.data.leadTypes);
                })
                .catch(err => {
                    console.error('Failed to load study class options:', err);
                })
                .finally(() => setLoadingData(false));
        }
    }, [isOpen]);

    // Initialize/prefill form values when modal opens
    useEffect(() => {
        if (!isOpen) return;

        setFormErrors({});

        const currentLead = lead || student?.lead;
        const customerName = currentLead?.name || student?.name || '';
        const suggestedName = customerName ? `PRIVATE - ${customerName.toUpperCase()}` : '';
        
        // Priority for branch: user's branch first (e.g. Solo), fallback to lead/student branch, then first branch in list
        const branchId = userBranchId || currentLead?.branch_id || student?.branch_id || (normalizedBranches[0]?.id || '');
        const isOnline = Boolean(currentLead?.is_online);
        const startDate = defaultStartDate || new Date().toISOString().split('T')[0];

        // Find best-matching price master (e.g. contains 'private' or first available)
        let pmId = '';
        let matchedPm = null;
        if (priceMasters && priceMasters.length > 0) {
            matchedPm = priceMasters.find(p => p.name?.toLowerCase().includes('private')) || priceMasters[0];
            pmId = matchedPm ? matchedPm.id : '';
        }

        const initialDays = ['Monday', 'Wednesday'];
        const initialTotal = matchedPm?.total_sessions ? Number(matchedPm.total_sessions) : 36;
        const initialEndDate = calculateCompletionDate(startDate, initialTotal, initialDays) || '';

        setForm({
            name: suggestedName,
            category: 'Private',
            type: isOnline ? 'online' : 'offline',
            branch_id: branchId,
            instructor_id: '',
            price_master_id: pmId,
            start_session_date: startDate,
            end_session_date: initialEndDate,
            total_meetings: initialTotal,
            meetings_per_week: initialDays.length,
            schedule_days: initialDays,
            status: 'active',
        });
    }, [isOpen, lead, student, defaultStartDate, priceMasters, normalizedBranches, userBranchId]);

    // Fallback sync if branches or user branch resolves after modal opens
    useEffect(() => {
        if (isOpen && !form.branch_id) {
            const fallbackId = userBranchId || lead?.branch_id || student?.branch_id || (normalizedBranches[0]?.id || '');
            if (fallbackId) {
                setForm(prev => ({ ...prev, branch_id: fallbackId }));
            }
        }
    }, [isOpen, userBranchId, normalizedBranches, form.branch_id]);

    // Auto-update meetings_per_week when schedule_days change
    const handleDaysChange = (days) => {
        const newDays = Array.isArray(days) ? days : [];
        const meetingsCount = Math.max(1, newDays.length);
        const autoEndDate = calculateCompletionDate(form.start_session_date, form.total_meetings, newDays);
        setForm(prev => ({
            ...prev,
            schedule_days: newDays,
            meetings_per_week: meetingsCount,
            end_session_date: autoEndDate || prev.end_session_date,
        }));
    };

    const handleStartDateChange = (date) => {
        const autoEndDate = calculateCompletionDate(date, form.total_meetings, form.schedule_days);
        setForm(prev => ({
            ...prev,
            start_session_date: date,
            end_session_date: autoEndDate || prev.end_session_date,
        }));
    };

    const handleTotalMeetingsChange = (total) => {
        const val = parseInt(total, 10) || 0;
        const autoEndDate = calculateCompletionDate(form.start_session_date, val, form.schedule_days);
        setForm(prev => ({
            ...prev,
            total_meetings: val,
            end_session_date: autoEndDate || prev.end_session_date,
        }));
    };

    const handleAutoCalculate = () => {
        const autoEndDate = calculateCompletionDate(form.start_session_date, form.total_meetings, form.schedule_days);
        if (autoEndDate) {
            setForm(prev => ({ ...prev, end_session_date: autoEndDate }));
        } else {
            alert('Pastikan launch date, total sessions, dan weekly days telah dipilih.');
        }
    };

    const categoryOptions = [
        { value: 'group', label: 'Group Classes' },
        { value: 'private', label: 'Non-Group / Private' },
    ];

    const typeOptions = [
        { value: 'offline', label: 'OFFLINE' },
        { value: 'online', label: 'ONLINE' },
    ];

    const branchOptions = useMemo(() => {
        return normalizedBranches.map(b => ({ value: b.id, label: b.name }));
    }, [normalizedBranches]);

    const priceOptions = useMemo(() => {
        return (priceMasters || []).map(pm => ({
            value: pm.id,
            label: `${pm.name} (${pm.total_sessions ? `${pm.total_sessions} Sesi • ` : ''}Rp ${new Intl.NumberFormat('id-ID').format(pm.price_per_session || 0)})`,
        }));
    }, [priceMasters]);

    const handlePriceChange = (val) => {
        const pm = (priceMasters || []).find(p => p.id === val);
        const newTotalMeetings = pm?.total_sessions ? Number(pm.total_sessions) : form.total_meetings;
        const autoEndDate = calculateCompletionDate(form.start_session_date, newTotalMeetings, form.schedule_days);
        setForm(prev => ({
            ...prev,
            price_master_id: val,
            total_meetings: newTotalMeetings,
            end_session_date: autoEndDate || prev.end_session_date,
        }));
    };

    const dayOptions = [
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});

        // Client-side validation
        const errors = {};
        if (!form.name.trim()) errors.name = 'Class identifier wajib diisi.';
        if (!form.branch_id) errors.branch_id = 'Pilih center location.';
        if (!form.price_master_id) errors.price_master_id = 'Pilih pricing structure.';
        if (!form.total_meetings || form.total_meetings < 1) errors.total_meetings = 'Total sessions minimal 1.';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setSubmitting(true);
        try {
            const res = await axios.post(route('admin.academic.study-classes.store'), form, {
                headers: { 'Accept': 'application/json' }
            });

            if (res.data?.class) {
                if (onCreated) {
                    onCreated(res.data.class);
                }
                onClose();
            } else {
                onClose();
            }
        } catch (err) {
            console.error('Error creating class:', err);
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                alert('Gagal membuat kelas: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[10050]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-100">
                                {/* Header */}
                                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
                                            <GraduationCap className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                                Create New Class
                                            </h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                Academic Module
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={submitting}
                                        className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-slate-400"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {loadingData ? (
                                    <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                                        <p className="text-xs font-bold">Memuat konfigurasi kelas...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                        {/* Basic Info Section */}
                                        <div className="space-y-4">
                                            <PremiumFormGroup label="Class Identifier" error={formErrors.name} required>
                                                <TextInput
                                                    id="name"
                                                    value={form.name}
                                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                                    className={`w-full !rounded-xl !py-3 !px-4 border-slate-200 focus:border-red-500 transition-all font-bold text-sm ${formErrors.name ? 'border-red-500' : ''}`}
                                                    placeholder="e.g. Paris & Co (Intermediate)"
                                                />
                                            </PremiumFormGroup>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <PremiumFormGroup label="Kategori Kelas" error={formErrors.category} required>
                                                    <PremiumSearchableSelect
                                                        options={categoryOptions}
                                                        value={form.category}
                                                        onChange={(val) => setForm(prev => ({ ...prev, category: val }))}
                                                        placeholder="Pilih Kategori Kelas"
                                                        icon={Users}
                                                        error={formErrors.category}
                                                    />
                                                </PremiumFormGroup>

                                                <PremiumFormGroup label="Jenis Kelas" error={formErrors.type} required>
                                                    <PremiumSearchableSelect
                                                        options={typeOptions}
                                                        value={form.type}
                                                        onChange={(val) => setForm(prev => ({ ...prev, type: val }))}
                                                        placeholder="Pilih Jenis Kelas"
                                                        icon={GraduationCap}
                                                        error={formErrors.type}
                                                    />
                                                </PremiumFormGroup>

                                                <PremiumFormGroup label="Center Location" error={formErrors.branch_id} required>
                                                    <PremiumSearchableSelect
                                                        options={branchOptions}
                                                        value={form.branch_id}
                                                        onChange={(val) => setForm(prev => ({ ...prev, branch_id: val }))}
                                                        placeholder="Select Branch"
                                                        icon={MapPin}
                                                        error={formErrors.branch_id}
                                                    />
                                                </PremiumFormGroup>
                                            </div>

                                            <PremiumFormGroup
                                                label="Pricing Structure (Master Harga)"
                                                error={formErrors.price_master_id}
                                                required
                                            >
                                                <PremiumSearchableSelect
                                                    options={priceOptions}
                                                    value={form.price_master_id}
                                                    onChange={handlePriceChange}
                                                    placeholder="Pilih Skema Harga..."
                                                    icon={Zap}
                                                    error={formErrors.price_master_id}
                                                />
                                                <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-1 italic tracking-tight">
                                                    * Digunakan untuk estimasi otomatis biaya pendaftaran di CRM.
                                                </p>
                                            </PremiumFormGroup>
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
                                                <PremiumFormGroup label="Total Sessions" error={formErrors.total_meetings}>
                                                    <div className="relative">
                                                        <TextInput
                                                            type="number"
                                                            value={form.total_meetings}
                                                            onChange={(e) => handleTotalMeetingsChange(e.target.value)}
                                                            className={`w-full !rounded-xl !pl-10 !py-2.5 font-bold text-sm ${formErrors.total_meetings ? 'border-red-500' : ''}`}
                                                        />
                                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    </div>
                                                </PremiumFormGroup>

                                                <PremiumFormGroup label="Meetings/Week" error={formErrors.meetings_per_week}>
                                                    <div className="relative">
                                                        <TextInput
                                                            type="number"
                                                            value={form.meetings_per_week}
                                                            onChange={(e) => setForm(prev => ({ ...prev, meetings_per_week: parseInt(e.target.value, 10) || 1 }))}
                                                            className={`w-full !rounded-xl !pl-10 !py-2.5 font-bold text-sm ${formErrors.meetings_per_week ? 'border-red-500' : ''}`}
                                                        />
                                                        <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    </div>
                                                </PremiumFormGroup>

                                                <PremiumFormGroup label="Weekly Days" error={formErrors.schedule_days}>
                                                    <PremiumSearchableMultiSelect
                                                        options={dayOptions}
                                                        value={form.schedule_days}
                                                        onChange={handleDaysChange}
                                                        placeholder="Click to select days"
                                                        className={`w-full ${formErrors.schedule_days ? 'border-red-500' : ''}`}
                                                    />
                                                </PremiumFormGroup>
                                            </div>
                                        </div>

                                        {/* Timeline Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <PremiumFormGroup label="Launch Date" error={formErrors.start_session_date} required>
                                                <DatePicker
                                                    value={form.start_session_date}
                                                    onChange={handleStartDateChange}
                                                    placeholder="Select launch date"
                                                    align="top-left"
                                                    inputClassName={`!rounded-xl !py-2.5 !h-[42px] font-bold text-sm ${formErrors.start_session_date ? '!border-red-500' : ''}`}
                                                />
                                            </PremiumFormGroup>
                                            <PremiumFormGroup
                                                label="Target Completion"
                                                error={formErrors.end_session_date}
                                                action={
                                                    <div className="flex items-center gap-2">
                                                        {form.end_session_date && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setForm(prev => ({ ...prev, end_session_date: '' }))}
                                                                className="text-[10px] font-extrabold text-slate-400 hover:text-red-600 uppercase tracking-wider transition-colors cursor-pointer"
                                                            >
                                                                Hapus
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={handleAutoCalculate}
                                                            className="text-[10px] font-extrabold text-red-600 hover:text-red-700 hover:underline uppercase tracking-wider transition-colors cursor-pointer"
                                                        >
                                                            Hitung Otomatis
                                                        </button>
                                                    </div>
                                                }
                                            >
                                                <DatePicker
                                                    value={form.end_session_date}
                                                    onChange={(val) => setForm(prev => ({ ...prev, end_session_date: val }))}
                                                    placeholder="Select completion date"
                                                    isClearable={true}
                                                    align="top-right"
                                                    inputClassName={`!rounded-xl !py-2.5 !h-[42px] font-bold text-sm ${formErrors.end_session_date ? '!border-red-500' : ''}`}
                                                />
                                            </PremiumFormGroup>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                            <SecondaryButton
                                                type="button"
                                                onClick={onClose}
                                                disabled={submitting}
                                                className="bg-white !rounded-xl !py-2.5 !px-8 font-bold text-xs uppercase tracking-widest border-slate-200 cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
                                            >
                                                Back
                                            </SecondaryButton>
                                            <PrimaryButton
                                                type="submit"
                                                disabled={submitting}
                                                className="!rounded-xl !py-2.5 !px-8 !bg-red-600 hover:!bg-red-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 border-none flex items-center gap-2 cursor-pointer active:scale-95"
                                            >
                                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                                Confirm & Launch
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
