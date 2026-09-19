import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import TextArea from '@/Components/ui/TextArea';
import { BookOpen, Tag, DollarSign, Calculator, Calendar, Loader2, Save, Plus, Trash2, X, RefreshCw, AlertCircle, Gift, CheckCircle2, Percent } from 'lucide-react';
import DatePicker from '@/Components/form/DatePicker';
import Button from '@/Components/ui/Button';
import TextInput from '@/Components/TextInput';
import CreateClassQuickModal from './CreateClassQuickModal';

export default function PlotAndInvoiceModal({ show, onClose, lead, student, targetInvoice = null, classes = [], priceMasters = [] }) {
    const { loyaltySettings = [], siblingSettings = {}, initialFeeSettings = {} } = usePage().props;
    const defaultRegFee = initialFeeSettings.registration_fee ?? 25000;
    const defaultPtFee = initialFeeSettings.placement_test_fee ?? 100000;

    const formatNumberWithDots = (num) => {
        if (!num && num !== 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumberFromDots = (val) => {
        const clean = val.replace(/\./g, '').replace(/[^0-9]/g, '');
        return clean === '' ? 0 : parseInt(clean, 10);
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        lead_id: '',
        student_id: '',
        study_class_id: '',
        price_master_id: '',
        join_date: '',
        notes: '',
        items: [],
        manual_discounts: [], // [{name, amount}] - admin-added discounts
        billing_mode: 'prorata',
    });

    const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
    const [createdClasses, setCreatedClasses] = useState([]);

    const classList = useMemo(() => {
        let base = [];
        if (classes) {
            if (Array.isArray(classes)) base = classes;
            else if (classes.data && Array.isArray(classes.data)) base = classes.data;
        }
        return [...createdClasses, ...base];
    }, [classes, createdClasses]);

    const handleClassCreated = (newClass) => {
        setCreatedClasses(prev => [newClass, ...prev]);
        const isPrivate = newClass.is_private === true 
            || newClass.category?.toLowerCase() === 'private' 
            || newClass.name?.toLowerCase().includes('private');

        setData(prev => ({
            ...prev,
            study_class_id: newClass.id,
            price_master_id: newClass.price_master_id || prev.price_master_id,
            join_date: newClass.start_session_date || prev.join_date,
            billing_mode: isPrivate ? 'full' : prev.billing_mode,
        }));
        setIsCreateClassOpen(false);
    };

    const priceMasterList = useMemo(() => {
        if (!priceMasters) return [];
        if (Array.isArray(priceMasters)) return priceMasters;
        if (priceMasters.data && Array.isArray(priceMasters.data)) return priceMasters.data;
        return [];
    }, [priceMasters]);

    const hasSibling = useMemo(() => {
        const currentLead = lead || student?.lead;
        if (!currentLead) return false;

        // Strictly check for sibling relationship type
        const relationships = currentLead.lead_relationships || currentLead.leadRelationships || currentLead.relationships || [];
        if (Array.isArray(relationships) && relationships.some(r => (r.type === 'sibling' || r.pivot?.type === 'sibling'))) {
            return true;
        }

        const related = currentLead.related_leads || currentLead.relatedLeads || [];
        if (Array.isArray(related) && related.some(r => (r.pivot?.type === 'sibling' || r.type === 'sibling'))) {
            return true;
        }

        const guardians = currentLead.guardians || currentLead.lead_guardians || currentLead.leadGuardians || [];
        if (Array.isArray(guardians) && guardians.some(g => g.role === 'sibling' || g.role === 'saudara')) {
            return true;
        }

        return false;
    }, [lead, student]);

    useEffect(() => {
        if (show && (lead || student || targetInvoice)) {
            const currentLead = lead || student?.lead || targetInvoice?.lead;
            const existingInvoice = targetInvoice
                || currentLead?.invoices?.find(inv => inv.status === 'pending')
                || student?.invoices?.find(inv => inv.status === 'pending');

            const classId = existingInvoice?.study_class_id
                || student?.study_classes?.[0]?.id
                || currentLead?.plotting?.study_class_id
                || '';
            const existingNotes = existingInvoice?.notes || currentLead?.plotting?.notes || '';

            let joinDate = (existingInvoice?.start_date || currentLead?.plotting?.join_date || new Date().toISOString().split('T')[0]).substring(0, 10);
            let billingMode = 'prorata';

            const targetClass = classList.find(c => c.id === classId);
            const isPrivate = targetClass?.is_private || targetClass?.category?.toLowerCase() === 'private' || targetClass?.name?.toLowerCase().includes('private');

            // If active student (paket lanjut renewal) or private class, default to full cycle
            if ((student && student.status === 'active') || isPrivate) {
                billingMode = 'full';
                const currentClass = student?.study_classes?.[0] || targetClass;

                if (!existingInvoice && currentClass?.end_session_date && Array.isArray(currentClass.schedule_days)) {
                    const findNextMeeting = (endDateStr, scheduleDays) => {
                        const date = new Date(endDateStr);
                        for (let i = 1; i <= 7; i++) {
                            const next = new Date(date);
                            next.setDate(date.getDate() + i);
                            const dayName = next.toLocaleDateString('en-US', { weekday: 'long' });
                            if (scheduleDays.includes(dayName)) {
                                return next.toISOString().substring(0, 10);
                            }
                        }
                        const nextDay = new Date(date);
                        nextDay.setDate(date.getDate() + 1);
                        return nextDay.toISOString().substring(0, 10);
                    };

                    joinDate = findNextMeeting(currentClass.end_session_date, currentClass.schedule_days);
                }
            }

            // Derive price_master_id from the class if available
            let priceId = '';
            const targetClassId = classId;
            if (targetClassId && classList.length > 0) {
                const cls = classList.find(c => c.id === targetClassId);
                if (cls) {
                    priceId = cls.price_master_id || '';
                }
            }

            if (existingInvoice) {
                // Extract custom non-class items from existing invoice
                const customItems = (existingInvoice.items || [])
                    .filter(item => !item.name.toLowerCase().startsWith('kelas:'))
                    .map(item => ({
                        name: item.name,
                        unit_price: item.unit_price,
                        quantity: item.quantity
                    }));

                setData({
                    lead_id: currentLead?.id || existingInvoice.lead_id || '',
                    student_id: student?.id || existingInvoice.student_id || '',
                    study_class_id: classId,
                    price_master_id: priceId,
                    join_date: joinDate,
                    notes: existingNotes,
                    billing_mode: billingMode,
                    manual_discounts: [],
                    items: customItems,
                });
            } else {
                const isPlacementTestPhase = currentLead?.lead_phase?.code === 'placement-test' || currentLead?.lead_phase?.name === 'Placement Test';
                const initialItems = (isPlacementTestPhase && !classId)
                    ? [{ name: 'Placement Test Fee', unit_price: 50000, quantity: 1 }]
                    : [];

                setData({
                    lead_id: currentLead?.id || '',
                    student_id: student?.id || '',
                    study_class_id: classId,
                    price_master_id: priceId,
                    join_date: joinDate,
                    notes: existingNotes,
                    billing_mode: billingMode,
                    manual_discounts: [],
                    items: initialItems,
                });
            }
        }
    }, [show, lead, student, targetInvoice, classList]);

    const selectedClass = useMemo(() => {
        return classList.find(c => c.id === data.study_class_id);
    }, [data.study_class_id, classList]);

    const formattedScheduleDays = useMemo(() => {
        if (!selectedClass || !Array.isArray(selectedClass.schedule_days) || selectedClass.schedule_days.length === 0) {
            const isPrivate = selectedClass?.is_private || selectedClass?.category?.toLowerCase() === 'private' || selectedClass?.name?.toLowerCase().includes('private');
            return isPrivate ? 'Fleksibel / Sesuai Kesepakatan (Private)' : '';
        }
        const dayTranslations = {
            'Monday': 'Senin',
            'Tuesday': 'Selasa',
            'Wednesday': 'Rabu',
            'Thursday': 'Kamis',
            'Friday': 'Jumat',
            'Saturday': 'Sabtu',
            'Sunday': 'Minggu',
        };
        return selectedClass.schedule_days.map(d => dayTranslations[d] || d).join(', ');
    }, [selectedClass]);

    const selectedPrice = useMemo(() => {
        return priceMasterList.find(p => p.id === data.price_master_id);
    }, [data.price_master_id, priceMasterList]);

    const remainingSessions = useMemo(() => {
        if (!selectedClass) return 0;

        const isPrivate = selectedClass.is_private === true
            || selectedClass.category?.toLowerCase() === 'private'
            || selectedClass.name?.toLowerCase().includes('private');

        const currentProgress = selectedClass.manual_session_progress ?? selectedClass.session_progress ?? 0;
        const totalMeetings = selectedClass.total_meetings || 0;

        // If class is Private, or has no end_session_date, or has no schedule_days:
        // Remaining sessions are the package sessions minus progress already attended
        if (isPrivate || !selectedClass.end_session_date || !Array.isArray(selectedClass.schedule_days) || selectedClass.schedule_days.length === 0) {
            return Math.max(0, totalMeetings - currentProgress);
        }

        if (!data.join_date) return 0;

        // Implementation of calculateRemainingMeetings from useLeadPlotting
        const calculateRemaining = (startDate, endDate, scheduleDays, joinDateStr) => {
            if (!startDate || !endDate || !scheduleDays || !joinDateStr) return 0;
            const rawJoinDate = new Date(joinDateStr);
            const day = rawJoinDate.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const joinDate = new Date(rawJoinDate);
            joinDate.setDate(rawJoinDate.getDate() + diffToMonday);
            joinDate.setHours(0, 0, 0, 0);

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);

            if (joinDate > end) return 0;

            let count = 0;
            let current = new Date(joinDate);
            while (current <= end) {
                if (current >= start) {
                    const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
                    if (Array.isArray(scheduleDays) && scheduleDays.includes(dayName)) {
                        count++;
                    }
                }
                current.setDate(current.getDate() + 1);
            }
            return count;
        };

        const calculated = calculateRemaining(
            selectedClass.start_session_date,
            selectedClass.end_session_date,
            selectedClass.schedule_days,
            data.join_date
        );

        if (calculated === 0 && new Date(data.join_date) <= new Date(selectedClass.start_session_date || data.join_date)) {
            return Math.max(0, totalMeetings - currentProgress);
        }

        return calculated;
    }, [selectedClass, data.join_date]);

    const baseClassSubtotal = useMemo(() => {
        if (!selectedPrice || !selectedClass?.total_meetings) return 0;

        if (data.billing_mode === 'full') {
            return selectedPrice.price_per_session || 0;
        }

        if (!remainingSessions) return 0;

        const rate = (selectedPrice.price_per_session || 0) / (selectedClass.total_meetings || 1);
        return Math.round(remainingSessions * rate);
    }, [selectedPrice, remainingSessions, selectedClass, data.billing_mode]);

    const siblingPercent = 10;
    const siblingDiscountAmount = useMemo(() => {
        if (!hasSibling || !baseClassSubtotal) return 0;
        return Math.round((siblingPercent / 100) * baseClassSubtotal);
    }, [hasSibling, baseClassSubtotal]);

    useEffect(() => {
        if (hasSibling && siblingDiscountAmount > 0 && data.discount_amount === 0) {
            setData('discount_amount', siblingDiscountAmount);
        }
    }, [hasSibling, siblingDiscountAmount]);

    const isExpired = useMemo(() => {
        if (!selectedClass?.end_session_date) return false;
        return new Date(selectedClass.end_session_date) < new Date().setHours(0, 0, 0, 0);
    }, [selectedClass]);

    const hasNoPrice = useMemo(() => {
        return selectedClass && !selectedClass.price_master_id;
    }, [selectedClass]);

    const itemsTotal = useMemo(() => {
        return (data.items || []).reduce((sum, item) => sum + (Number(item.unit_price || 0) * Number(item.quantity || 1)), 0);
    }, [data.items]);

    // Auto-compute loyalty discount from loyaltySettings props (preview only, backend also calculates)
    const autoLoyaltyDiscount = useMemo(() => {
        if (!student || !loyaltySettings?.length) return null;
        const rejoinCount = student.rejoin_count || 0;
        const startJoin = student.start_join;
        const sorted = [...loyaltySettings].sort((a, b) => b.min_rejoin_count - a.min_rejoin_count);
        const match = sorted.find(s => {
            if (rejoinCount < s.min_rejoin_count) return false;
            if (s.use_join_date_limit && startJoin && s.join_date_limit) {
                const sj = new Date(startJoin);
                const limit = new Date(s.join_date_limit);
                if (s.join_date_operator === 'before' && !(sj < limit)) return false;
                if (s.join_date_operator === 'after' && !(sj >= limit)) return false;
            }
            return true;
        });
        return match || null;
    }, [student, loyaltySettings]);

    // Auto-compute sibling discount for both Lead and Student
    const autoSiblingDiscount = useMemo(() => {
        if (!hasSibling || !baseClassSubtotal) return null;
        const pct = Number(siblingSettings?.sibling_discount_percent) || 10;
        return { percent: pct, amount: Math.round((pct / 100) * baseClassSubtotal) };
    }, [hasSibling, siblingSettings, baseClassSubtotal]);

    const manualDiscountTotal = useMemo(() => {
        return (data.manual_discounts || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    }, [data.manual_discounts]);

    const autoDiscountTotal = useMemo(() => {
        return (autoLoyaltyDiscount?.discount_amount || 0) + (autoSiblingDiscount?.amount || 0);
    }, [autoLoyaltyDiscount, autoSiblingDiscount]);

    const totalDiscountPreview = manualDiscountTotal + autoDiscountTotal;

    const totalAmount = useMemo(() => Math.max(0, baseClassSubtotal + itemsTotal - totalDiscountPreview), [baseClassSubtotal, itemsTotal, totalDiscountPreview]);

    const addManualDiscount = (name = '', amount = 0) => {
        setData('manual_discounts', [...(data.manual_discounts || []), { name, amount }]);
    };

    const removeManualDiscount = (idx) => {
        setData('manual_discounts', data.manual_discounts.filter((_, i) => i !== idx));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const addItem = (name = '', price = 0) => {
        setData('items', [...(data.items || []), { name, unit_price: price, quantity: 1 }]);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.finance.invoices.generate'), {
            onSuccess: (page) => {
                const downloadUrl = page.props.flash?.download_url;
                if (downloadUrl) {
                    window.open(downloadUrl, '_blank');
                }
                reset();
                onClose();
            },
        });
    };

    const classOptions = useMemo(() => classList.map(c => ({
        value: c.id,
        label: `${c.name || 'Class'} - #${c.current_session_number || 0} (${c.branch?.name || 'Any'})`
    })), [classList]);

    const priceOptions = useMemo(() => priceMasterList.map(p => ({
        value: p.id,
        label: `${p.name || 'Rate'} (${p.total_sessions ? `${p.total_sessions} Sesi • ` : ''}${formatCurrency(p.price_per_session || 0)})`
    })), [priceMasterList]);

    return (
        <>
            <Transition.Root show={show} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl transition-all sm:my-6 sm:w-full sm:max-w-6xl border border-slate-100 flex flex-col max-h-[92vh]">
                                <form onSubmit={submit} className="flex flex-col h-full overflow-hidden">
                                    <div className="px-8 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/20">
                                                <Calculator size={22} />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                                    Issue <span className="text-red-600">Invoice</span>
                                                </Dialog.Title>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                                    {student ? 'Rejoin Student' : 'Plotting lead'}: <span className="text-slate-900 font-black">{student ? student.lead?.name : lead?.name}</span>
                                                    {student?.loyalty_tier && (
                                                        <span className="ml-2.5 px-2.5 py-0.5 bg-red-50 text-red-600 rounded-full font-black text-xs uppercase tracking-wider border border-red-100">
                                                            {student.loyalty_tier} ({student.rejoin_count || 0}x Join)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={onClose}
                                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors shadow-none cursor-pointer"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>

                                    <div className="p-6 sm:p-7 overflow-y-auto bg-slate-50/60 flex-1">
                                        {Object.keys(errors).length > 0 && (
                                            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in">
                                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h5 className="text-xs font-black text-red-900 uppercase tracking-wide">Gagal Membuat Invoice</h5>
                                                    <ul className="mt-1 text-xs font-bold text-red-700 list-disc list-inside space-y-0.5">
                                                        {Object.values(errors).map((err, idx) => (
                                                            <li key={idx}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                            {/* Left Column (Inputs & Options) - 7 Columns */}
                                            <div className="lg:col-span-7 space-y-4">
                                                {/* Class & Date */}
                                                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3.5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <InputLabel value="Seleksi Kelas" className="uppercase text-xs tracking-wider font-black text-slate-700" />
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setIsCreateClassOpen(true)}
                                                                        className="inline-flex items-center gap-1 text-[11px] font-black text-red-600 hover:text-red-700 hover:underline transition-colors cursor-pointer"
                                                                    >
                                                                        <Plus size={12} className="stroke-[3]" /> Buat Kelas Baru
                                                                    </button>
                                                                    <span className="text-[10px] font-bold text-slate-400">(Kosongkan jika PT)</span>
                                                                </div>
                                                            </div>
                                                            <PremiumSearchableSelect
                                                                options={classOptions}
                                                                value={data.study_class_id}
                                                                onChange={(val) => {
                                                                    const cls = classList.find(c => c.id === val);
                                                                    let nextJoinDate = data.join_date;
                                                                    if (student) {
                                                                        const currentClass = student.study_classes?.[0];
                                                                        const endDate = currentClass?.end_session_date || new Date().toISOString().split('T')[0];
                                                                        const scheduleDays = cls?.schedule_days || [];

                                                                        if (endDate && Array.isArray(scheduleDays) && scheduleDays.length > 0) {
                                                                            const date = new Date(endDate);
                                                                            let found = false;
                                                                            for (let i = 1; i <= 7; i++) {
                                                                                const next = new Date(date);
                                                                                next.setDate(date.getDate() + i);
                                                                                const dayName = next.toLocaleDateString('en-US', { weekday: 'long' });
                                                                                if (scheduleDays.includes(dayName)) {
                                                                                    nextJoinDate = next.toISOString().split('T')[0];
                                                                                    found = true;
                                                                                    break;
                                                                                }
                                                                            }
                                                                            if (!found) {
                                                                                const fallback = new Date(date);
                                                                                fallback.setDate(fallback.getDate() + 1);
                                                                                nextJoinDate = fallback.toISOString().split('T')[0];
                                                                            }
                                                                        }
                                                                    }
                                                                    const isPrivateClass = cls?.is_private || cls?.category?.toLowerCase() === 'private' || cls?.name?.toLowerCase().includes('private');
                                                                    setData(prev => ({
                                                                        ...prev,
                                                                        study_class_id: val,
                                                                        price_master_id: cls?.price_master_id || '',
                                                                        join_date: nextJoinDate,
                                                                        billing_mode: isPrivateClass ? 'full' : prev.billing_mode,
                                                                    }));
                                                                }}
                                                                icon={BookOpen}
                                                                placeholder="Cari kelas..."
                                                            />
                                                            <InputError message={errors.study_class_id} />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <InputLabel value="Tanggal Rencana Masuk" className="uppercase text-xs tracking-wider font-black text-slate-700" />
                                                            <DatePicker
                                                                value={data.join_date}
                                                                onChange={(val) => setData('join_date', val)}
                                                                className="w-full"
                                                            />
                                                            <InputError message={errors.join_date} />
                                                            <p className="text-[10px] font-bold text-slate-400 italic flex items-center gap-1.5 ml-0.5">
                                                                <RefreshCw size={11} /> Diinisialisasi dari data Pre-Enrollment
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {selectedClass && (
                                                        <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                                                                <p className="font-black text-blue-950 uppercase tracking-wider text-[11px]">
                                                                    Jadwal: <span className="font-bold text-blue-800">{formattedScheduleDays || 'Belum ada hari diset'}</span>
                                                                </p>
                                                            </div>
                                                            <p className="text-[11px] font-bold text-blue-700">
                                                                {selectedClass.meetings_per_week ? `${selectedClass.meetings_per_week}x/mgg • ` : ''}
                                                                {selectedClass.total_meetings ? `Total ${selectedClass.total_meetings} Pertemuan` : ''}
                                                                {selectedClass.instructor?.name ? ` • Pengajar: ${selectedClass.instructor.name}` : ''}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {hasNoPrice && (
                                                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-bold uppercase tracking-wider">
                                                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                            <span>Kelas ini belum memiliki data Master Harga. Silakan setting harga di Akademik.</span>
                                                        </div>
                                                    )}

                                                    {isExpired && (
                                                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800 font-bold uppercase tracking-wider">
                                                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                                                            <span>Masa berlaku kelas ini sudah berakhir ({selectedClass.end_session_date}).</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Billing Mode */}
                                                {(!student || student.status !== 'active') ? (
                                                    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Metode Penagihan</h4>
                                                            <p className="text-[11px] font-bold text-slate-500 italic">Pilih pro-rata sisa pertemuan atau satu siklus penuh</p>
                                                        </div>
                                                        <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentLead = lead || student?.lead;
                                                                    const originalJoinDate = currentLead?.plotting?.join_date || new Date().toISOString().split('T')[0];
                                                                    setData(prev => ({
                                                                        ...prev,
                                                                        billing_mode: 'prorata',
                                                                        join_date: originalJoinDate
                                                                    }));
                                                                }}
                                                                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${data.billing_mode === 'prorata' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                                            >
                                                                Pro-rata
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const targetClass = selectedClass || (student?.study_classes?.[0]);
                                                                    let nextDate = (data.join_date || '').substring(0, 10);
                                                                    if (targetClass?.end_session_date && Array.isArray(targetClass.schedule_days)) {
                                                                        const findNextMeeting = (endDateStr, scheduleDays) => {
                                                                            const date = new Date(endDateStr);
                                                                            for (let i = 1; i <= 7; i++) {
                                                                                const next = new Date(date);
                                                                                next.setDate(date.getDate() + i);
                                                                                const dayName = next.toLocaleDateString('en-US', { weekday: 'long' });
                                                                                if (scheduleDays.includes(dayName)) {
                                                                                    return next.toISOString().substring(0, 10);
                                                                                }
                                                                            }
                                                                            const nextDay = new Date(date);
                                                                            nextDay.setDate(date.getDate() + 1);
                                                                            return nextDay.toISOString().substring(0, 10);
                                                                        };
                                                                        nextDate = findNextMeeting(targetClass.end_session_date, targetClass.schedule_days);
                                                                    }
                                                                    setData(prev => ({
                                                                        ...prev,
                                                                        billing_mode: 'full',
                                                                        join_date: nextDate
                                                                    }));
                                                                }}
                                                                className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${data.billing_mode === 'full' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                                            >
                                                                Satu Siklus Penuh
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-200 flex items-center gap-3">
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                                        <div>
                                                            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Perpanjangan Paket Lanjut</h4>
                                                            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-0.5">
                                                                Biaya dihitung penuh 1 siklus paket perpanjangan ({data.join_date}).
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Addons & Extras */}
                                                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Addons & Extras</h4>
                                                            <p className="text-[11px] font-bold text-slate-400 italic">Tambahkan biaya lain jika diperlukan</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => addItem('Registration Fee', defaultRegFee)}
                                                                className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                                                            >
                                                                <Plus size={12} /> Registrasi
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => addItem('Placement Test Fee', defaultPtFee)}
                                                                className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                                                            >
                                                                <Plus size={12} /> Placement
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => addItem('', 0)}
                                                                className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                                                            >
                                                                <Plus size={12} /> Custom
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {data.items.length > 0 && (
                                                        <div className="space-y-2 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
                                                            {data.items.map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                                                                    <Tag size={13} className="text-slate-400 shrink-0 ml-1" />
                                                                    <input
                                                                        type="text"
                                                                        value={item.name}
                                                                        onChange={e => { const n = [...data.items]; n[idx].name = e.target.value; setData('items', n); }}
                                                                        className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs font-bold text-slate-700 placeholder:text-slate-400 p-0 shadow-none"
                                                                        placeholder="Nama biaya tambahan..."
                                                                    />
                                                                    <div className="relative flex items-center">
                                                                        <span className="absolute left-2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">Rp</span>
                                                                        <input
                                                                            type="text"
                                                                            value={formatNumberWithDots(item.unit_price)}
                                                                            onChange={e => {
                                                                                const cleanVal = parseNumberFromDots(e.target.value);
                                                                                const n = [...data.items];
                                                                                n[idx].unit_price = cleanVal;
                                                                                setData('items', n);
                                                                            }}
                                                                            className="w-28 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 text-right py-1 px-2 pl-7 shadow-none focus:ring-1 focus:ring-red-500"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setData('items', data.items.filter((_, i) => i !== idx))}
                                                                        className="w-7 h-7 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                                                        title="Hapus Item"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Internal Notes */}
                                                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-1.5">
                                                    <InputLabel value="Catatan Internal" className="uppercase text-xs tracking-wider font-black text-slate-700" />
                                                    <input
                                                        type="text"
                                                        value={data.notes || ''}
                                                        onChange={e => setData('notes', e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                                        placeholder="Catatan tambahan (opsional)..."
                                                    />
                                                </div>
                                            </div>

                                            {/* Right Column (Calculation Breakdown & Actions) - 5 Columns */}
                                            <div className="lg:col-span-5 space-y-4">
                                                {/* Calculation Card */}
                                                <div className="bg-white rounded-3xl p-6 text-slate-900 space-y-4 border border-slate-200/80 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                                        <DollarSign size={80} className="text-slate-900" />
                                                    </div>

                                                    <div className="flex justify-between items-center text-xs font-black text-slate-800 uppercase pb-3 border-b border-slate-100">
                                                        <span className="flex items-center gap-2 text-slate-900 font-black">
                                                            <Calculator className="w-4 h-4 text-red-600" />
                                                            Calculation Breakdown
                                                        </span>
                                                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                            {data.billing_mode === 'full' ? 'Satu Siklus' : 'Pro-Rata'}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2.5 text-xs font-bold text-slate-700">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-600">
                                                                Class Plotting ({data.billing_mode === 'full' ? selectedClass?.total_meetings || 24 : remainingSessions} Sesi)
                                                            </span>
                                                            <span className="font-black text-slate-900 text-sm">{formatCurrency(baseClassSubtotal)}</span>
                                                        </div>

                                                        {itemsTotal > 0 && (
                                                            <div className="flex justify-between items-center text-slate-600">
                                                                <span>Extra Items</span>
                                                                <span className="font-black text-slate-900 text-sm">{formatCurrency(itemsTotal)}</span>
                                                            </div>
                                                        )}

                                                        {/* Auto Discounts */}
                                                        {autoLoyaltyDiscount && (
                                                            <div className="pt-2 border-t border-dashed border-slate-200 space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="flex items-center gap-1.5 text-rose-600 font-black text-[11px]">
                                                                        <Gift size={13} /> Loyalty {autoLoyaltyDiscount.tier_name}
                                                                    </span>
                                                                    <span className="font-black text-rose-600">- {formatCurrency(autoLoyaltyDiscount.discount_amount)}</span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider pl-4">
                                                                    + Voucher Cafe Rp {Number(autoLoyaltyDiscount.cafe_points || 0).toLocaleString('id-ID')}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {autoSiblingDiscount && (
                                                            <div className="pt-1 flex justify-between items-center">
                                                                <span className="flex items-center gap-1.5 text-sky-600 font-black text-[11px]">
                                                                    <Percent size={13} /> Sibling ({autoSiblingDiscount.percent}%)
                                                                </span>
                                                                <span className="font-black text-sky-600">- {formatCurrency(autoSiblingDiscount.amount)}</span>
                                                            </div>
                                                        )}

                                                        {/* Manual Discounts */}
                                                        <div className="pt-2.5 border-t border-dashed border-slate-200 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                                                                    <Tag size={13} className="text-violet-500" />
                                                                    Diskon Tambahan
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addManualDiscount('', 0)}
                                                                    className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                                                                >
                                                                    <Plus size={11} /> Tambah
                                                                </button>
                                                            </div>

                                                            {data.manual_discounts.length > 0 && (
                                                                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                                                    {data.manual_discounts.map((d, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 bg-violet-50/60 border border-violet-200/80 px-2.5 py-1.5 rounded-xl">
                                                                            <input
                                                                                type="text"
                                                                                value={d.name}
                                                                                onChange={e => {
                                                                                    const n = [...data.manual_discounts];
                                                                                    n[idx].name = e.target.value;
                                                                                    setData('manual_discounts', n);
                                                                                }}
                                                                                className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-xs font-bold text-violet-950 placeholder:text-slate-400 p-0 shadow-none"
                                                                                placeholder="Nama diskon..."
                                                                            />
                                                                            <div className="relative flex items-center">
                                                                                <span className="absolute left-1 text-[9px] font-black text-violet-400 pointer-events-none">Rp</span>
                                                                                <input
                                                                                    type="text"
                                                                                    value={formatNumberWithDots(d.amount)}
                                                                                    onChange={e => {
                                                                                        const cleanVal = parseNumberFromDots(e.target.value);
                                                                                        const n = [...data.manual_discounts];
                                                                                        n[idx].amount = cleanVal;
                                                                                        setData('manual_discounts', n);
                                                                                    }}
                                                                                    className="w-24 bg-white border border-violet-200 rounded-lg text-xs font-black text-violet-900 text-right py-0.5 px-1.5 pl-5 shadow-none"
                                                                                    placeholder="0"
                                                                                />
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeManualDiscount(idx)}
                                                                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer shrink-0"
                                                                                title="Hapus Diskon"
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {manualDiscountTotal > 0 && (
                                                                <div className="flex justify-between text-xs font-bold uppercase text-violet-600 pt-1">
                                                                    <span>Total Diskon Tambahan</span>
                                                                    <span className="font-black">- {formatCurrency(manualDiscountTotal)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Total Amount Box */}
                                                    <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
                                                        <div>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Invoice Amount</span>
                                                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                Awaiting Confirmation
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-3xl sm:text-4xl font-black text-red-600 tracking-tight block">
                                                                {formatCurrency(totalAmount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 rounded-b-[32px]">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-6 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer active:scale-95"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || (!selectedClass && (data.items || []).length === 0) || (selectedClass && (!selectedPrice || isExpired || hasNoPrice))}
                                            className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-red-600/25 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            {processing ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                                            Terbitkan Invoice
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child >
                    </div >
                </div >
            </Dialog >
        </Transition.Root >

        <CreateClassQuickModal
            isOpen={isCreateClassOpen}
            onClose={() => setIsCreateClassOpen(false)}
            onCreated={handleClassCreated}
            lead={lead || student?.lead}
            student={student}
            priceMasters={priceMasterList}
            defaultStartDate={data.join_date}
        />
    </>
    );
}
