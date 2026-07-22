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

        // Strictly check for sibling relationship type
        const relationships = currentLead.lead_relationships || currentLead.leadRelationships || currentLead.relationships || [];
        if (Array.isArray(relationships) && relationships.some(r => (r.type === 'sibling' || r.pivot?.type === 'sibling'))) {
            return true;
        }

        const related = currentLead.related_leads || currentLead.relatedLeads || [];
        if (Array.isArray(related) && related.some(r => (r.pivot?.type === 'sibling' || r.type === 'sibling'))) {
            return true;
        }

        const guardians = currentLead.guardians || [];
        if (Array.isArray(guardians) && guardians.some(g => g.role === 'sibling' || g.role === 'saudara')) {
            return true;
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
    }, [show, lead, student, classList]);

    const selectedClass = useMemo(() => {
        return classList.find(c => c.id === data.study_class_id);
    }, [data.study_class_id, classList]);

    const formattedScheduleDays = useMemo(() => {
        if (!selectedClass || !Array.isArray(selectedClass.schedule_days) || selectedClass.schedule_days.length === 0) {
            return '';
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[36px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-slate-100">
                                <form onSubmit={submit}>
                                    <div className="px-10 pt-10 pb-8 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20">
                                                <Calculator size={26} />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                                    Issue <span className="text-red-600">Invoice</span>
                                                </Dialog.Title>
                                                <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mt-1">
                                                    {student ? 'Rejoin Student' : 'Plotting lead'}: <span className="text-slate-900 font-black">{student ? student.lead?.name : lead?.name}</span>
                                                    {student?.loyalty_tier && (
                                                        <span className="ml-3 px-3 py-1 bg-red-50 text-red-600 rounded-full font-black text-sm uppercase tracking-wider border border-red-100">
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
                                            <X size={24} />
                                        </Button>
                                    </div>

                                    <div className="px-10 py-10 space-y-10">
                                        {Object.keys(errors).length > 0 && (
                                            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 animate-in fade-in">
                                                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <h5 className="text-sm font-black text-red-900 uppercase tracking-wide">Gagal Membuat Invoice</h5>
                                                    <ul className="mt-1 text-sm font-bold text-red-700 list-disc list-inside space-y-1">
                                                        {Object.values(errors).map((err, idx) => (
                                                            <li key={idx}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <InputLabel value="Seleksi Kelas" className="uppercase text-sm tracking-wider font-black text-slate-700" />
                                                    <span className="text-sm font-bold text-slate-500">(Kosongkan jika hanya Placement Test)</span>
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

                                                 {selectedClass && (
                                                     <div className="mt-3 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-top-1 shadow-sm">
                                                         <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                                         <div>
                                                             <p className="text-sm font-black text-blue-950 uppercase tracking-wider">
                                                                 Jadwal Kelas: {formattedScheduleDays || 'Belum ada hari diset'}
                                                             </p>
                                                             <p className="text-xs font-bold text-blue-700 mt-1">
                                                                 {selectedClass.meetings_per_week ? `${selectedClass.meetings_per_week}x Pertemuan / Minggu` : ''} 
                                                                 {selectedClass.total_meetings ? ` • Total ${selectedClass.total_meetings} Pertemuan` : ''}
                                                                 {selectedClass.instructor?.name ? ` • Pengajar: ${selectedClass.instructor.name}` : ''}
                                                             </p>
                                                         </div>
                                                     </div>
                                                 )}

                                                 {/* Warning Messages */}
                                                 {hasNoPrice && (
                                                     <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                                         <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                         <p className="text-xs font-bold text-amber-700 leading-relaxed uppercase tracking-wider">
                                                             Kelas ini belum memiliki data Master Harga. Silakan hubungi Akademik untuk setting harga kelas.
                                                         </p>
                                                     </div>
                                                 )}

                                                 {isExpired && (
                                                     <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                                         <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                                         <p className="text-xs font-bold text-red-700 leading-relaxed uppercase tracking-wider">
                                                             Masa berlaku kelas ini sudah berakhir ({selectedClass.end_session_date}). Tidak disarankan untuk invoice baru.
                                                         </p>
                                                     </div>
                                                 )}
                                             </div>
                                             <div className="space-y-3">
                                                 <InputLabel value="Tanggal Rencana Masuk" className="uppercase text-sm tracking-wider font-black text-slate-700" />
                                                 <DatePicker
                                                     value={data.join_date}
                                                     onChange={(val) => setData('join_date', val)}
                                                     className="w-full"
                                                 />
                                                 <InputError message={errors.join_date} />
                                                 <p className="text-sm font-bold text-slate-500 italic flex items-center gap-2 ml-1">
                                                     <RefreshCw size={14} /> Diinisialisasi dari data Pre-Enrollment
                                                 </p>
                                             </div>
                                         </div>

                                         {/* Billing Mode Section */}
                                         {!student ? (
                                             <div className="space-y-4 pt-6 border-t border-slate-100">
                                                 <div className="flex items-center justify-between">
                                                     <div>
                                                         <h3 className="text-base font-black text-slate-900 uppercase tracking-wider leading-none mb-2">Metode Penagihan</h3>
                                                         <p className="text-sm font-bold text-slate-500 italic">Pilih satu siklus penuh atau hitung sisa pertemuan</p>
                                                     </div>
                                                     <div className="flex bg-slate-100 p-1.5 rounded-2xl">
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
                                                             className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-none ${data.billing_mode === 'prorata' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:text-slate-800 hover:bg-transparent'}`}
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
                                                             className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-none ${data.billing_mode === 'full' ? 'bg-white text-slate-900 shadow-sm hover:bg-white' : 'text-slate-500 hover:text-slate-800 hover:bg-transparent'}`}
                                                         >
                                                             Satu Siklus Penuh
                                                         </Button>
                                                     </div>
                                                 </div>
                                             </div>
                                         ) : (
                                             <div className="space-y-4 pt-6 border-t border-slate-100">
                                                 <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-start gap-4">
                                                     <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                                     <div>
                                                         <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wider">Rejoin Mode Aktif</h4>
                                                         <p className="text-sm font-bold text-emerald-800 leading-relaxed uppercase tracking-wider mt-1">
                                                             Biaya dihitung penuh 1 siklus paket. Tanggal masuk diinisialisasi otomatis ke jadwal pertemuan pertama setelah kelas sebelumnya selesai ({data.join_date}).
                                                         </p>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}

                                         <div className="space-y-6 pt-6 border-t border-slate-100">
                                             <div className="flex items-center justify-between">
                                                 <div>
                                                     <h3 className="text-base font-black text-slate-900 uppercase tracking-wider leading-none mb-2">Addons & Extras</h3>
                                                     <p className="text-sm font-bold text-slate-500 italic">Tambahkan biaya lain jika diperlukan</p>
                                                 </div>
                                                 <div className="flex flex-wrap gap-3">
                                                       <Button
                                                           type="button"
                                                           variant="secondary"
                                                           icon={Plus}
                                                           onClick={() => addItem('Registration Fee', defaultRegFee)}
                                                           className="group text-sm font-black px-5 py-3 !bg-orange-500 hover:!bg-orange-600 text-white rounded-2xl uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
                                                       >
                                                           Registrasi
                                                       </Button>
                                                       <Button
                                                           type="button"
                                                           variant="secondary"
                                                           icon={Plus}
                                                           onClick={() => addItem('Placement Test Fee', defaultPtFee)}
                                                           className="group text-sm font-black px-5 py-3 !bg-blue-600 hover:!bg-blue-700 text-white rounded-2xl uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
                                                       >
                                                           Placement
                                                       </Button>
                                                       <Button
                                                           type="button"
                                                           variant="secondary"
                                                           icon={Plus}
                                                           onClick={() => addItem('', 0)}
                                                           className="group text-sm font-black px-5 py-3 !bg-slate-900 hover:!bg-slate-800 text-white rounded-2xl uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
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
                                                                <input
                                                                    type="text"
                                                                    value={item.name}
                                                                    onChange={e => { const n = [...data.items]; n[idx].name = e.target.value; setData('items', n); }}
                                                                    className="w-full bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:italic p-0 shadow-none"
                                                                    placeholder="Nama biaya tambahan..."
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">Rp</span>
                                                                    <input
                                                                        type="text"
                                                                        value={formatNumberWithDots(item.unit_price)}
                                                                        onChange={e => {
                                                                            const cleanVal = parseNumberFromDots(e.target.value);
                                                                            const n = [...data.items];
                                                                            n[idx].unit_price = cleanVal;
                                                                            setData('items', n);
                                                                        }}
                                                                        className="w-28 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm font-black text-slate-900 text-right p-0 pl-6 shadow-none"
                                                                        placeholder="0"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setData('items', data.items.filter((_, i) => i !== idx))}
                                                                    className="w-10 h-10 bg-red-100 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                                                    title="Hapus Item"
                                                                >
                                                                    <Trash2 className="w-5 h-5 stroke-[2.5]" />
                                                                </button>
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
                                                 <div className="flex justify-between items-center text-sm font-black text-slate-800 uppercase pb-6 border-b border-slate-100">
                                                     <span className="flex items-center gap-3">
                                                         <Calculator className="w-5 h-5 text-red-600" />
                                                         Calculation Breakdown
                                                     </span>
                                                     <span>Pro-Rata</span>
                                                 </div>
                                                 <div className="space-y-4">
                                                     <div className="flex justify-between items-center text-sm font-bold uppercase text-slate-700">
                                                         <span>Class Plotting ({remainingSessions} Sessions)</span>
                                                         <span className="font-black text-slate-900 text-base">{formatCurrency(baseClassSubtotal)}</span>
                                                     </div>
                                                     {itemsTotal > 0 && (
                                                         <div className="flex justify-between text-sm font-bold uppercase text-slate-700">
                                                             <span>Extra Items</span>
                                                             <span className="font-black text-slate-900 text-base">{formatCurrency(itemsTotal)}</span>
                                                         </div>
                                                     )}

                                                     {/* Auto Discounts - Read Only Preview */}
                                                     {
                                                         autoLoyaltyDiscount && (
                                                             <div className="pt-2 border-t border-dashed border-slate-200 space-y-2">
                                                                 <div className="flex justify-between items-center">
                                                                     <div className="flex items-center gap-2">
                                                                         <Gift className="w-4 h-4 text-rose-500" />
                                                                         <span className="text-sm font-black text-rose-600 uppercase">Diskon Loyalty {autoLoyaltyDiscount.tier_name}</span>
                                                                     </div>
                                                                     <span className="text-sm font-black text-rose-600">- {formatCurrency(autoLoyaltyDiscount.discount_amount)}</span>
                                                                 </div>
                                                                 <p className="text-sm font-bold text-rose-500 uppercase tracking-wider pl-6">
                                                                     + Voucher Cafe Rp {Number(autoLoyaltyDiscount.cafe_points || 0).toLocaleString('id-ID')} setelah lunas
                                                                 </p>
                                                             </div>
                                                         )}

                                                     {
                                                         autoSiblingDiscount && (
                                                             <div className="flex justify-between items-center">
                                                                 <div className="flex items-center gap-2">
                                                                     <Percent className="w-4 h-4 text-sky-500" />
                                                                     <span className="text-sm font-black text-sky-600 uppercase">Diskon Sibling ({autoSiblingDiscount.percent}%)</span>
                                                                 </div>
                                                                 <span className="text-sm font-black text-sky-600">- {formatCurrency(autoSiblingDiscount.amount)}</span>
                                                             </div>
                                                         )
                                                     }

                                                     {/* Manual Discounts - Admin Added */}
                                                     <div className="pt-3 border-t border-dashed border-slate-200 space-y-3">
                                                         <div className="flex items-center justify-between">
                                                             <span className="text-sm font-black text-slate-700 uppercase flex items-center gap-2">
                                                                 <Tag className="w-4 h-4 text-violet-500" />
                                                                 Diskon Tambahan
                                                             </span>
                                                             <Button
                                                                 type="button"
                                                                 variant="secondary"
                                                                 icon={Plus}
                                                                 onClick={() => addManualDiscount('', 0)}
                                                                 className="text-sm font-black px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
                                                             >
                                                                 Tambah
                                                             </Button>
                                                         </div>

                                                         {data.manual_discounts.length > 0 ? (
                                                             <div className="space-y-2">
                                                                 {data.manual_discounts.map((d, idx) => (
                                                                     <div key={idx} className="flex items-center gap-3 bg-white border border-violet-200 px-4 py-2.5 rounded-2xl group shadow-sm">
                                                                         <input
                                                                             type="text"
                                                                             value={d.name}
                                                                             onChange={e => {
                                                                                 const n = [...data.manual_discounts];
                                                                                 n[idx].name = e.target.value;
                                                                                 setData('manual_discounts', n);
                                                                             }}
                                                                             className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm font-bold text-violet-950 placeholder:text-slate-400 p-0 shadow-none"
                                                                             placeholder="Nama diskon..."
                                                                         />
                                                                         <div className="relative flex items-center">
                                                                             <span className="absolute left-0 text-xs font-black text-violet-400 pointer-events-none">Rp</span>
                                                                             <input
                                                                                 type="text"
                                                                                 value={formatNumberWithDots(d.amount)}
                                                                                 onChange={e => {
                                                                                     const cleanVal = parseNumberFromDots(e.target.value);
                                                                                     const n = [...data.manual_discounts];
                                                                                     n[idx].amount = cleanVal;
                                                                                     setData('manual_discounts', n);
                                                                                 }}
                                                                                 className="w-32 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-sm font-black text-violet-900 text-right p-0 pl-6 shadow-none"
                                                                                 placeholder="0"
                                                                             />
                                                                         </div>
                                                                         <button
                                                                            type="button"
                                                                            onClick={() => removeManualDiscount(idx)}
                                                                            className="w-10 h-10 bg-red-100 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                                                            title="Hapus Diskon"
                                                                        >
                                                                            <Trash2 className="w-5 h-5 stroke-[2.5]" />
                                                                        </button>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         ) : null}

                                                         {manualDiscountTotal > 0 && (
                                                             <div className="flex justify-between text-sm font-bold uppercase text-violet-600">
                                                                 <span>Total Diskon Tambahan</span>
                                                                 <span className="font-black">- {formatCurrency(manualDiscountTotal)}</span>
                                                             </div>
                                                         )}
                                                     </div>
                                                 </div >
                                                 <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                                                     <div>
                                                         <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Total Invoice Amount</span>
                                                         <p className="text-sm font-bold text-emerald-800 uppercase mt-2 tracking-wider bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 inline-block">Awaiting Confirmation</p>
                                                     </div>
                                                     <span className="text-5xl font-black tracking-tighter text-red-600">{formatCurrency(totalAmount)}</span>
                                                 </div>
                                             </div >
                                        )
                                        }

                                        <div>
                                            <InputLabel value="Catatan Internal" className="uppercase text-sm tracking-wider font-black text-slate-700 mb-2" />
                                            <TextArea value={data.notes} onChange={e => setData('notes', e.target.value)} className="bg-slate-50 border-none rounded-2xl text-sm font-bold" rows={2} placeholder="Opsional..." />
                                        </div>
                                    </div >

                                    <div className="px-10 py-10 bg-slate-50 flex items-center justify-end gap-4 rounded-b-[36px]">
                                        <Button
                                            variant="secondary"
                                            onClick={onClose}
                                            className="!rounded-2xl !text-sm uppercase tracking-wider font-black px-8 py-4"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={processing || (!selectedClass && (data.items || []).length === 0) || (selectedClass && (!selectedPrice || isExpired || hasNoPrice))}
                                            className="!bg-red-600 hover:!bg-red-700 !rounded-2xl !text-sm uppercase tracking-wider font-black px-12 py-4 shadow-xl shadow-red-600/30"
                                        >
                                            {processing ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
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
