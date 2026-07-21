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

export default function PlotAndInvoiceModal({ show, onClose, lead, student, classes = [], priceMasters = [] }) {
    const { loyaltySettings = [], siblingSettings = {} } = usePage().props;

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

    const classList = useMemo(() => {
        if (!classes) return [];
        if (Array.isArray(classes)) return classes;
        if (classes.data && Array.isArray(classes.data)) return classes.data;
        return [];
    }, [classes]);

    const priceMasterList = useMemo(() => {
        if (!priceMasters) return [];
        if (Array.isArray(priceMasters)) return priceMasters;
        if (priceMasters.data && Array.isArray(priceMasters.data)) return priceMasters.data;
        return [];
    }, [priceMasters]);

    const hasSibling = useMemo(() => {
        const currentLead = lead || student?.lead;
        if (!currentLead) return false;
        if (Array.isArray(currentLead.lead_relationships) && currentLead.lead_relationships.length > 0) {
            return currentLead.lead_relationships.some(r => r.type === 'sibling');
        }
        return false;
    }, [lead, student]);

    useEffect(() => {
        if (show && (lead || student)) {
            const currentLead = lead || student?.lead;
            const classId = student?.study_classes?.[0]?.id || currentLead?.plotting?.study_class_id || '';
            const existingNotes = currentLead?.plotting?.notes || '';

            let joinDate = currentLead?.plotting?.join_date || new Date().toISOString().split('T')[0];
            let billingMode = 'prorata';

            // Special logic for Rejoin Students (Renewal)
            if (student) {
                billingMode = 'full'; // Default to full cycle for renewals
                const currentClass = student.study_classes?.[0] || classList.find(c => c.id === classId);

                if (currentClass?.end_session_date && Array.isArray(currentClass.schedule_days)) {
                    const findNextMeeting = (endDateStr, scheduleDays) => {
                        const date = new Date(endDateStr);
                        // Loop up to 7 days to find the next matching day
                        for (let i = 1; i <= 7; i++) {
                            const next = new Date(date);
                            next.setDate(date.getDate() + i);
                            const dayName = next.toLocaleDateString('en-US', { weekday: 'long' });
                            if (scheduleDays.includes(dayName)) {
                                return next.toISOString().split('T')[0];
                            }
                        }
                        return new Date(date.setDate(date.getDate() + 1)).toISOString().split('T')[0];
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

            setData({
                lead_id: currentLead?.id || '',
                student_id: student?.id || '',
                study_class_id: classId,
                price_master_id: priceId,
                join_date: joinDate,
                notes: existingNotes,
                billing_mode: billingMode,
                manual_discounts: [],
                items: [],
            });
        }
    }, [show, lead, student, classList]);

    const selectedClass = useMemo(() => {
        return classList.find(c => c.id === data.study_class_id);
    }, [data.study_class_id, classList]);

    const selectedPrice = useMemo(() => {
        return priceMasterList.find(p => p.id === data.price_master_id);
    }, [data.price_master_id, priceMasterList]);

    const remainingSessions = useMemo(() => {
        if (!selectedClass || !data.join_date) return 0;

        // Implementation of calculateRemainingMeetings from useLeadPlotting
        const calculateRemaining = (startDate, endDate, scheduleDays, joinDateStr) => {
            if (!startDate || !endDate || !scheduleDays || !joinDateStr) return 0;
            const joinDate = new Date(joinDateStr);
            const end = new Date(endDate);
            if (joinDate > end) return 0;

            let count = 0;
            let current = new Date(joinDate);
            while (current <= end) {
                const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
                if (Array.isArray(scheduleDays) && scheduleDays.includes(dayName)) {
                    count++;
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

    // Auto-compute sibling discount
    const autoSiblingDiscount = useMemo(() => {
        if (!student || !siblingSettings?.use_sibling_discount) return null;
        const hasSibling = student.lead?.related_leads?.some(r => r.pivot?.type === 'sibling') ||
            student.lead?.relatedLeads?.some(r => r.pivot?.type === 'sibling');
        if (!hasSibling) return null;
        const pct = siblingSettings.sibling_discount_percent || 0;
        if (!pct) return null;
        return { percent: pct, amount: Math.round((pct / 100) * baseClassSubtotal) };
    }, [student, siblingSettings, baseClassSubtotal]);

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
        label: `${p.name || 'Rate'} (${formatCurrency(p.price_per_session || 0)})`
    })), [priceMasterList]);

    return (
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-slate-100">
                                <form onSubmit={submit}>
                                    <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20">
                                                <Calculator size={20} />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                                    Issue <span className="text-red-600">Invoice</span>
                                                </Dialog.Title>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                                                    {student ? 'Rejoin Student' : 'Plotting lead'}: {student ? student.lead?.name : lead?.name}
                                                    {student?.loyalty_tier && (
                                                        <span className="ml-2 px-2.5 py-1 bg-red-50 text-red-600 rounded-full font-black text-[9px] uppercase tracking-wider border border-red-100">
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
                                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors shadow-none"
                                        >
                                            <X size={20} />
                                        </Button>
                                    </div>

                                    <div className="px-8 py-10 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <InputLabel value="Seleksi Kelas" className="uppercase text-[10px] tracking-widest font-black text-slate-400" />
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
                                                        setData(prev => ({
                                                            ...prev,
                                                            study_class_id: val,
                                                            price_master_id: cls?.price_master_id || '',
                                                            join_date: nextJoinDate,
                                                        }));
                                                    }}
                                                    icon={BookOpen}
                                                    placeholder="Cari kelas..."
                                                />
                                                <InputError message={errors.study_class_id} />

                                                {/* Warning Messages */}
                                                {hasNoPrice && (
                                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase tracking-wider">
                                                            Kelas ini belum memiliki data Master Harga. Silakan hubungi Akademik untuk setting harga kelas.
                                                        </p>
                                                    </div>
                                                )}

                                                {isExpired && (
                                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] font-bold text-red-700 leading-relaxed uppercase tracking-wider">
                                                            Masa berlaku kelas ini sudah berakhir ({selectedClass.end_session_date}). Tidak disarankan untuk invoice baru.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <InputLabel value="Tanggal Rencana Masuk" className="uppercase text-[10px] tracking-widest font-black text-slate-400" />
                                                <DatePicker
                                                    value={data.join_date}
                                                    onChange={(val) => setData('join_date', val)}
                                                    className="w-full"
                                                />
                                                <InputError message={errors.join_date} />
                                                <p className="text-[9px] font-bold text-slate-400 italic flex items-center gap-1.5 ml-1">
                                                    <RefreshCw size={8} /> Diinisialisasi dari data Pre-Enrollment
                                                </p>
                                            </div>
                                        </div>

                                        {/* Billing Mode Section */}
                                        {!student ? (
                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Metode Penagihan</h3>
                                                        <p className="text-[9px] font-bold text-slate-400 italic">Pilih satu siklus penuh atau hitung sisa pertemuan</p>
                                                    </div>
                                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const currentLead = lead || student?.lead;
                                                                const originalJoinDate = currentLead?.plotting?.join_date || new Date().toISOString().split('T')[0];
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    billing_mode: 'prorata',
                                                                    join_date: originalJoinDate
                                                                }));
                                                            }}
                                                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-none ${data.billing_mode === 'prorata' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                                        >
                                                            Pro-rata
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const targetClass = selectedClass || (student?.study_classes?.[0]);
                                                                let nextDate = data.join_date;
                                                                if (targetClass?.end_session_date && Array.isArray(targetClass.schedule_days)) {
                                                                    const findNextMeeting = (endDateStr, scheduleDays) => {
                                                                        const date = new Date(endDateStr);
                                                                        for (let i = 1; i <= 7; i++) {
                                                                            const next = new Date(date);
                                                                            next.setDate(date.getDate() + i);
                                                                            const dayName = next.toLocaleDateString('en-US', { weekday: 'long' });
                                                                            if (scheduleDays.includes(dayName)) {
                                                                                return next.toISOString().split('T')[0];
                                                                            }
                                                                        }
                                                                        return new Date(date.setDate(date.getDate() + 1)).toISOString().split('T')[0];
                                                                    };
                                                                    nextDate = findNextMeeting(targetClass.end_session_date, targetClass.schedule_days);
                                                                }
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    billing_mode: 'full',
                                                                    join_date: nextDate
                                                                }));
                                                            }}
                                                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-none ${data.billing_mode === 'full' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-transparent'}`}
                                                        >
                                                            Satu Siklus Penuh
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Rejoin Mode Aktif</h4>
                                                        <p className="text-[10px] font-bold text-emerald-700 leading-relaxed uppercase tracking-wider mt-1">
                                                            Biaya dihitung penuh 1 siklus paket. Tanggal masuk diinisialisasi otomatis ke jadwal pertemuan pertama setelah kelas sebelumnya selesai ({data.join_date}).
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Addons & Extras</h3>
                                                    <p className="text-[9px] font-bold text-slate-400 italic">Tambahkan biaya lain jika diperlukan</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        icon={Plus}
                                                        onClick={() => addItem('Placement Test Fee', 50000)}
                                                        className="group text-[9px] font-black px-3.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all shadow-none"
                                                    >
                                                        Placement
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        icon={Plus}
                                                        onClick={() => addItem('', 0)}
                                                        className="group text-[9px] font-black px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all shadow-none"
                                                    >
                                                        Custom
                                                    </Button>
                                                </div>
                                            </div>

                                            {data.items.length > 0 ? (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {data.items.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-[20px] border border-slate-200 shadow-sm group hover:border-red-200 hover:shadow-md transition-all">
                                                            <div className="flex-1 flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                                                    <Tag size={14} />
                                                                </div>
                                                                <TextInput
                                                                    value={item.name}
                                                                    onChange={e => { const n = [...data.items]; n[idx].name = e.target.value; setData('items', n); }}
                                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:italic p-0"
                                                                    placeholder="Nama biaya tambahan..."
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">Rp</span>
                                                                    <TextInput
                                                                        type="number"
                                                                        value={item.unit_price}
                                                                        onChange={e => { const n = [...data.items]; n[idx].unit_price = e.target.value; setData('items', n); }}
                                                                        className="w-28 bg-transparent border-none focus:ring-0 text-sm font-black text-slate-900 text-right p-0 pl-6"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    onClick={() => setData('items', data.items.filter((_, i) => i !== idx))}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-none p-0"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>

                                        {selectedClass && selectedPrice && (
                                            <div className="bg-white rounded-[32px] p-8 text-slate-900 space-y-6 border border-slate-200 shadow-sm relative overflow-hidden group transition-all hover:border-red-200">
                                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                                                    <DollarSign size={100} className="text-slate-900" />
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] pb-6 border-b border-slate-100">
                                                    <span className="flex items-center gap-3">
                                                        <Calculator className="w-4 h-4 text-red-600" />
                                                        Calculation Breakdown
                                                    </span>
                                                    <span>Pro-Rata</span>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                                        <span>Class Plotting ({remainingSessions} Sessions)</span>
                                                        <span className="font-black text-slate-900">{formatCurrency(baseClassSubtotal)}</span>
                                                    </div>
                                                    {itemsTotal > 0 && (
                                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                                            <span>Extra Items</span>
                                                            <span className="font-black text-slate-900">{formatCurrency(itemsTotal)}</span>
                                                        </div>
                                                    )}

<<<<<<< HEAD
    {/* Auto Discounts - Read Only Preview */ }
    {
        autoLoyaltyDiscount && (
            <div className="pt-2 border-t border-dashed border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <Gift className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Diskon Loyalty {autoLoyaltyDiscount.tier_name}</span>
=======
                                                     {hasSibling && (
                            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between animate-in fade-in duration-300">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-indigo-600/20">
                                        {siblingPercent}%
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">Diskon Sibling ({siblingPercent}%) Terdeteksi</p>
                                        <p className="text-[9px] font-bold text-indigo-600">Potongan otomatis diterapkan karena memiliki hubungan saudara/sibling.</p>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-indigo-700 shrink-0">
                                    - {formatCurrency(siblingDiscountAmount)}
                                </span>
                            </div>
                        )}

                        {student?.loyalty_rewards?.length > 0 && (
                                                         <div className="space-y-3">
                                                             <div className="flex justify-between items-center gap-4 pt-2 border-t border-dashed border-slate-100">
                                                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
                                                                     <Gift className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                                                                     Gunakan Voucher Loyalty
                                                                 </label>
                                                                 <select
                                                                     value={data.loyalty_reward_id}
                                                                     onChange={e => {
                                                                         const rId = e.target.value;
                                                                         const rewardItem = student.loyalty_rewards.find(r => r.id === rId);
                                                                         setData(prev => ({
                                                                             ...prev,
                                                                             loyalty_reward_id: rId,
                                                                             discount_amount: rewardItem ? rewardItem.discount_amount : 0
                                                                         }));
                                                                     }}
                                                                     className="w-48 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs font-black text-red-700 focus:ring-4 focus:ring-red-100 focus:border-red-300 transition-all"
                                                                 >
                                                                     <option value="">-- Tanpa Voucher --</option>
                                                                     {student.loyalty_rewards.map(reward => (
                                                                         <option key={reward.id} value={reward.id}>
                                                                             {reward.voucher_name} ({reward.tier_name})
                                                                         </option>
                                                                     ))}
                                                                 </select>
                                                             </div>
                                                             {data.loyalty_reward_id && (
                                                                 <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-300">
                                                                     <Gift className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                                                     <p className="text-[10px] font-bold text-red-700 leading-relaxed uppercase tracking-wider">
                                                                         Potongan harga {formatCurrency(data.discount_amount)} otomatis diterapkan. Student juga berhak mendapatkan Voucher Cafe {student.loyalty_rewards.find(r => r.id === data.loyalty_reward_id)?.voucher_name} senilai {formatCurrency(student.loyalty_rewards.find(r => r.id === data.loyalty_reward_id)?.cafe_points || 0)} setelah invoice lunas dibayar.
                                                                     </p>
>>>>>>> feature/student
                                                                 </div>
                                                                 <span className="text-[10px] font-black text-rose-600">- {formatCurrency(autoLoyaltyDiscount.discount_amount)}</span>
                                                             </div>
                                                             <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider pl-4.5">
                                                                 + Voucher Cafe Rp {Number(autoLoyaltyDiscount.cafe_points || 0).toLocaleString('id-ID')} setelah lunas
                                                             </p>
                                                         </div>
                                                     )}

<<<<<<< HEAD
        {
            autoSiblingDiscount && (
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                        <Percent className="w-3 h-3 text-sky-500" />
                        <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Diskon Sibling ({autoSiblingDiscount.percent}%)</span>
                    </div>
                    <span className="text-[10px] font-black text-sky-600">- {formatCurrency(autoSiblingDiscount.amount)}</span>
                </div>
            )
        }

        {/* Manual Discounts - Admin Added */ }
        <div className="pt-2 border-t border-dashed border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-violet-500" />
                    Diskon Tambahan
                </span>
                <Button
                    type="button"
                    variant="secondary"
                    icon={Plus}
                    onClick={() => addManualDiscount('', 0)}
                    className="text-[9px] font-black px-3 py-1.5 bg-violet-50 text-violet-600 rounded-xl uppercase tracking-wider hover:bg-violet-600 hover:text-white transition-all shadow-none"
                >
                    Tambah
                </Button>
            </div>

            {data.manual_discounts.length > 0 ? (
                <div className="space-y-2">
                    {data.manual_discounts.map((d, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-violet-50 px-3 py-2 rounded-xl group">
                            <TextInput
                                value={d.name}
                                onChange={e => {
                                    const n = [...data.manual_discounts];
                                    n[idx].name = e.target.value;
                                    setData('manual_discounts', n);
                                }}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold text-violet-800 placeholder:text-violet-300 p-0"
                                placeholder="Nama diskon..."
                            />
                            <div className="relative flex items-center">
                                <span className="absolute left-0 text-[10px] font-black text-violet-400 pointer-events-none">Rp</span>
                                <TextInput
                                    type="number"
                                    min="0"
                                    value={d.amount}
                                    onChange={e => {
                                        const n = [...data.manual_discounts];
                                        n[idx].amount = Math.max(0, parseInt(e.target.value) || 0);
                                        setData('manual_discounts', n);
                                    }}
                                    className="w-28 bg-transparent border-none focus:ring-0 text-xs font-black text-violet-900 text-right p-0 pl-5"
                                    placeholder="0"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => removeManualDiscount(idx)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-violet-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-none p-0"
                            >
                                <Trash2 size={12} />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : null}

            {manualDiscountTotal > 0 && (
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-violet-600">
                    <span>Total Diskon Tambahan</span>
                    <span className="font-black">- {formatCurrency(manualDiscountTotal)}</span>
                </div>
            )}
        </div>
                                                 </div >
            <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoice Amount</span>
                    <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1 tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">Awaiting Confirmation</p>
                </div>
                <span className="text-4xl font-black tracking-tighter text-red-600">{formatCurrency(totalAmount)}</span>
            </div>
=======
                                                    {/* Discount Input row */}
                                                    <div className="flex justify-between items-center gap-4 pt-3 border-t border-dashed border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-600/20 shrink-0">
                                                                <Tag size={13} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Diskon Tambahan</h4>
                                                                <p className="text-[9px] font-bold text-slate-400">Atur besaran potongan harga khusus</p>
                                                            </div>
                                                        </div>
                                                        <div className="relative flex items-center">
                                                            <span className="absolute left-3 text-[10px] font-black text-violet-600 uppercase pointer-events-none">Rp</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={data.discount_amount}
                                                                onChange={e => setData('discount_amount', Math.max(0, parseInt(e.target.value) || 0))}
                                                                className="w-40 pl-9 pr-3 py-2 bg-violet-50/80 border border-violet-200 rounded-xl text-sm font-black text-violet-700 text-right focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all shadow-sm"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                    {discountAmount > 0 && (
                                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-violet-600 pt-1">
                                                            <span>Potongan Diskon</span>
                                                            <span className="font-black">- {formatCurrency(discountAmount)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoice Amount</span>
                                                        <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1 tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">Awaiting Confirmation</p>
                                                    </div>
                                                    <span className="text-4xl font-black tracking-tighter text-red-600">{formatCurrency(totalAmount)}</span>
                                                </div>
>>>>>>> feature/student
                                            </div >
                                        )
    }

    <div>
        <InputLabel value="Catatan Internal" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
        <TextArea value={data.notes} onChange={e => setData('notes', e.target.value)} className="bg-slate-50 border-none rounded-2xl text-[11px] font-bold" rows={2} placeholder="Opsional..." />
    </div>
                                    </div >

        <div className="px-8 py-8 bg-slate-50 flex items-center justify-end gap-3 rounded-b-[32px]">
            <Button
                variant="secondary"
                onClick={onClose}
                className="!rounded-2xl !text-[10px] uppercase tracking-widest font-black px-6 py-3.5"
            >
                Batal
            </Button>
            <Button
                type="submit"
                variant="primary"
                disabled={processing || !selectedClass || !selectedPrice || isExpired || hasNoPrice}
                className="!bg-red-600 hover:!bg-red-700 !rounded-2xl !text-[10px] uppercase tracking-widest font-black px-10 py-3.5 shadow-xl shadow-red-600/30"
            >
                {processing ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save className="mr-2" size={14} />}
                Generate Invoice
            </Button>
        </div>
                                </form >
                            </Dialog.Panel >
                        </Transition.Child >
                    </div >
                </div >
            </Dialog >
        </Transition.Root >
    );
}
