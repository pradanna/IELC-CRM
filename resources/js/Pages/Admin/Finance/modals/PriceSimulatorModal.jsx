import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    Calculator, BookOpen, Tag, Calendar, Plus, Trash2, X, 
    Percent, RotateCcw, Info, CheckCircle2, DollarSign
} from 'lucide-react';
import DatePicker from '@/Components/form/DatePicker';
import Button from '@/Components/ui/Button';

export default function PriceSimulatorModal({ show, onClose, classes = [], priceMasters = [], initialFeeSettings = {} }) {
    const defaultRegFee = initialFeeSettings?.registration_fee ?? 25000;
    const defaultPtFee = initialFeeSettings?.placement_test_fee ?? 100000;

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

    // Form state
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedPriceId, setSelectedPriceId] = useState('');
    const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
    const [billingMode, setBillingMode] = useState('prorata'); // 'prorata' | 'full'
    const [useSiblingDiscount, setUseSiblingDiscount] = useState(false);
    const [siblingPercent, setSiblingPercent] = useState(10);
    const [customItems, setCustomItems] = useState([]);
    const [manualDiscounts, setManualDiscounts] = useState([]);

    // Reset when modal opens
    useEffect(() => {
        if (show) {
            if (classList.length > 0 && !selectedClassId) {
                const first = classList[0];
                setSelectedClassId(first.id);
                setSelectedPriceId(first.price_master_id || (priceMasterList[0]?.id || ''));
            }
        }
    }, [show, classList, priceMasterList]);

    // Update price when class changes
    const handleClassChange = (classId) => {
        setSelectedClassId(classId);
        const cls = classList.find(c => c.id === classId);
        if (cls?.price_master_id) {
            setSelectedPriceId(cls.price_master_id);
        }
    };

    const selectedClass = useMemo(() => {
        return classList.find(c => c.id === selectedClassId);
    }, [selectedClassId, classList]);

    const selectedPrice = useMemo(() => {
        return priceMasterList.find(p => p.id === selectedPriceId);
    }, [selectedPriceId, priceMasterList]);

    // Calculate remaining meetings for prorata
    const remainingSessions = useMemo(() => {
        if (!selectedClass) return 0;

        const isPrivate = selectedClass.is_private === true
            || selectedClass.category?.toLowerCase() === 'private'
            || selectedClass.name?.toLowerCase().includes('private');

        const currentProgress = selectedClass.manual_session_progress ?? selectedClass.session_progress ?? 0;
        const totalMeetings = selectedClass.total_meetings || 12;

        if (isPrivate || !selectedClass.end_session_date || !Array.isArray(selectedClass.schedule_days) || selectedClass.schedule_days.length === 0) {
            return Math.max(0, totalMeetings - currentProgress);
        }

        if (!joinDate) return 0;

        const calculateRemaining = (startDate, endDate, scheduleDays, joinDateStr) => {
            if (!startDate || !endDate || !scheduleDays || !joinDateStr) return 0;
            const rawJoinDate = new Date(joinDateStr);
            const day = rawJoinDate.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const join = new Date(rawJoinDate);
            join.setDate(rawJoinDate.getDate() + diffToMonday);
            join.setHours(0, 0, 0, 0);

            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);

            if (join > end) return 0;

            let count = 0;
            let current = new Date(join);
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
            joinDate
        );

        if (calculated === 0 && new Date(joinDate) <= new Date(selectedClass.start_session_date || joinDate)) {
            return Math.max(0, totalMeetings - currentProgress);
        }

        return calculated;
    }, [selectedClass, joinDate]);

    // Financial calculations
    const baseClassSubtotal = useMemo(() => {
        if (!selectedPrice) return 0;
        if (billingMode === 'full') {
            return selectedPrice.price_per_session || 0;
        }
        if (!remainingSessions || !selectedClass?.total_meetings) return 0;

        const rate = (selectedPrice.price_per_session || 0) / (selectedClass.total_meetings || 1);
        return Math.round(remainingSessions * rate);
    }, [selectedPrice, remainingSessions, selectedClass, billingMode]);

    const customItemsTotal = useMemo(() => {
        return customItems.reduce((acc, item) => acc + ((Number(item.unit_price) || 0) * (Number(item.quantity) || 1)), 0);
    }, [customItems]);

    const siblingDiscountAmount = useMemo(() => {
        if (!useSiblingDiscount || baseClassSubtotal <= 0) return 0;
        return Math.round((siblingPercent / 100) * baseClassSubtotal);
    }, [useSiblingDiscount, siblingPercent, baseClassSubtotal]);

    const manualDiscountsTotal = useMemo(() => {
        return manualDiscounts.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    }, [manualDiscounts]);

    const totalDiscount = siblingDiscountAmount + manualDiscountsTotal;
    const grossTotal = baseClassSubtotal + customItemsTotal;
    const netTotal = Math.max(0, grossTotal - totalDiscount);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Item handlers
    const handleAddPresetItem = (name, price) => {
        setCustomItems(prev => [...prev, {
            id: Date.now() + Math.random(),
            name,
            unit_price: price,
            quantity: 1,
        }]);
    };

    const handleRemoveCustomItem = (id) => {
        setCustomItems(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdateCustomItem = (id, field, value) => {
        setCustomItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    // Manual discount handlers
    const handleAddManualDiscount = () => {
        setManualDiscounts(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: 'Diskon Tambahan',
            amount: 50000,
        }]);
    };

    const handleRemoveManualDiscount = (id) => {
        setManualDiscounts(prev => prev.filter(d => d.id !== id));
    };

    const handleUpdateManualDiscount = (id, field, value) => {
        setManualDiscounts(prev => prev.map(d => {
            if (d.id === id) {
                return { ...d, [field]: value };
            }
            return d;
        }));
    };

    const handleReset = () => {
        if (classList.length > 0) {
            setSelectedClassId(classList[0].id);
            setSelectedPriceId(classList[0].price_master_id || '');
        }
        setJoinDate(new Date().toISOString().split('T')[0]);
        setBillingMode('prorata');
        setUseSiblingDiscount(false);
        setCustomItems([]);
        setManualDiscounts([]);
    };

    return (
        <Transition appear show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-[2.5rem] bg-white text-left align-middle shadow-2xl transition-all border border-slate-100 flex flex-col max-h-[92vh]">
                                
                                {/* Header */}
                                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold">
                                            <Calculator size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Dialog.Title as="h3" className="text-xl font-black text-slate-900 tracking-tight">
                                                    Simulasi Penghitungan Harga
                                                </Dialog.Title>
                                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100">
                                                    Kalkulator Estimasi
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">
                                                Hitung estimasi tarif kelas, prorata pertemuan, add-on, dan diskon (tidak menerbitkan tagihan).
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Body - 2 Columns */}
                                <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    
                                    {/* Left: Input Controls */}
                                    <div className="lg:col-span-7 space-y-6">
                                        
                                        {/* Class Selection */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                                                Pilih Kelas Belajar
                                            </label>
                                            <select
                                                value={selectedClassId}
                                                onChange={(e) => handleClassChange(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                                            >
                                                <option value="">-- Pilih Kelas --</option>
                                                {classList.map((cls) => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {cls.name} ({cls.branch?.name || 'All Branches'}) - {cls.total_meetings || 12} Sesi
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Price Master & Billing Mode */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                                                    Paket Tarif (Price Master)
                                                </label>
                                                <select
                                                    value={selectedPriceId}
                                                    onChange={(e) => setSelectedPriceId(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-slate-900"
                                                >
                                                    <option value="">-- Pilih Tarif --</option>
                                                    {priceMasterList.map((pm) => (
                                                        <option key={pm.id} value={pm.id}>
                                                            {pm.name} ({formatCurrency(pm.price_per_session)})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                                                    Mode Perhitungan
                                                </label>
                                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBillingMode('prorata')}
                                                        className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                                            billingMode === 'prorata'
                                                                ? 'bg-white text-slate-900 shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        Prorata Sesi
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBillingMode('full')}
                                                        className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                                            billingMode === 'full'
                                                                ? 'bg-white text-slate-900 shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        Full Paket
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Join Date & Prorata Preview */}
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                                                    Tanggal Rencana Masuk (Join Date)
                                                </label>
                                                <DatePicker
                                                    value={joinDate}
                                                    onChange={setJoinDate}
                                                    inputClassName="!py-2.5 !h-auto !bg-white !border-slate-200 !rounded-xl !text-sm !font-bold !text-slate-700"
                                                />
                                            </div>

                                            {selectedClass && (
                                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Sesi</span>
                                                        <span className="text-sm font-black text-slate-800">{selectedClass.total_meetings || 12}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Sisa Sesi</span>
                                                        <span className="text-sm font-black text-red-600">{billingMode === 'full' ? (selectedClass.total_meetings || 12) : remainingSessions} Sesi</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Tarif Kelas</span>
                                                        <span className="text-xs font-black text-slate-900">{formatCurrency(baseClassSubtotal)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add-on Items */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    Item Tambahan (Add-On)
                                                </label>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddPresetItem('Registration Fee', defaultRegFee)}
                                                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                                    >
                                                        + Reg Fee ({formatCurrency(defaultRegFee)})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddPresetItem('Placement Test Fee', defaultPtFee)}
                                                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                                    >
                                                        + PT Fee ({formatCurrency(defaultPtFee)})
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddPresetItem('Buku / Materi Kursus', 150000)}
                                                        className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                                    >
                                                        + Buku
                                                    </button>
                                                </div>
                                            </div>

                                            {customItems.length > 0 && (
                                                <div className="space-y-2 max-h-36 overflow-y-auto">
                                                    {customItems.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                                                            <input
                                                                type="text"
                                                                value={item.name}
                                                                onChange={(e) => handleUpdateCustomItem(item.id, 'name', e.target.value)}
                                                                className="flex-1 bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-800"
                                                                placeholder="Nama Item..."
                                                            />
                                                            <input
                                                                type="number"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleUpdateCustomItem(item.id, 'unit_price', e.target.value)}
                                                                className="w-28 bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-800"
                                                                placeholder="Harga"
                                                            />
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleUpdateCustomItem(item.id, 'quantity', e.target.value)}
                                                                className="w-14 bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-center text-slate-800"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveCustomItem(item.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Discounts Simulation */}
                                        <div className="space-y-3 pt-2 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    Diskon & Potongan Harga
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={handleAddManualDiscount}
                                                    className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                                                >
                                                    <Plus size={11} /> Diskon Manual
                                                </button>
                                            </div>

                                            {/* Sibling Loyalty Toggle */}
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="sim_sibling_discount"
                                                        checked={useSiblingDiscount}
                                                        onChange={(e) => setUseSiblingDiscount(e.target.checked)}
                                                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                                                    />
                                                    <label htmlFor="sim_sibling_discount" className="text-xs font-bold text-slate-700 cursor-pointer">
                                                        Simulasi Diskon Saudara (Sibling Loyalty - {siblingPercent}%)
                                                    </label>
                                                </div>
                                                {useSiblingDiscount && (
                                                    <span className="text-xs font-black text-emerald-600">
                                                        -{formatCurrency(siblingDiscountAmount)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Manual discounts list */}
                                            {manualDiscounts.map((d) => (
                                                <div key={d.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                                                    <input
                                                        type="text"
                                                        value={d.name}
                                                        onChange={(e) => handleUpdateManualDiscount(d.id, 'name', e.target.value)}
                                                        className="flex-1 bg-white border border-slate-200 rounded-lg py-1 px-3 text-xs font-bold text-slate-800"
                                                        placeholder="Keterangan diskon..."
                                                    />
                                                    <input
                                                        type="number"
                                                        value={d.amount}
                                                        onChange={(e) => handleUpdateManualDiscount(d.id, 'amount', e.target.value)}
                                                        className="w-28 bg-white border border-slate-200 rounded-lg py-1 px-3 text-xs font-bold text-slate-800"
                                                        placeholder="Nominal (Rp)"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveManualDiscount(d.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                    </div>

                                    {/* Right: Live Summary Output */}
                                    <div className="lg:col-span-5 flex flex-col justify-between">
                                        <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-6">
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
                                                    Rincian Estimasi Biaya
                                                </span>
                                                <h4 className="text-lg font-black tracking-tight text-white">
                                                    {selectedClass?.name || 'Pilih Kelas'}
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {selectedClass?.branch?.name || 'Cabang Belum Dipilih'} • {billingMode === 'full' ? 'Paket Penuh' : 'Prorata'}
                                                </p>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
                                                <div className="flex justify-between items-center text-slate-300">
                                                    <span>Paket Kelas ({billingMode === 'full' ? 'Full' : `${remainingSessions} sesi`})</span>
                                                    <span className="font-bold">{formatCurrency(baseClassSubtotal)}</span>
                                                </div>

                                                {customItems.length > 0 && (
                                                    <div className="flex justify-between items-center text-slate-300">
                                                        <span>Biaya Tambahan ({customItems.length} item)</span>
                                                        <span className="font-bold">+{formatCurrency(customItemsTotal)}</span>
                                                    </div>
                                                )}

                                                {totalDiscount > 0 && (
                                                    <div className="flex justify-between items-center text-emerald-400">
                                                        <span>Total Diskon</span>
                                                        <span className="font-black">-{formatCurrency(totalDiscount)}</span>
                                                    </div>
                                                )}

                                                <div className="pt-4 border-t border-slate-800">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                            Grand Total Estimasi
                                                        </span>
                                                        <span className="text-2xl font-black text-emerald-400 tracking-tight">
                                                            {formatCurrency(netTotal)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-start gap-2.5">
                                                <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                                    Hasil simulasi ini dapat digunakan untuk memberikan informasi biaya secara akurat saat konsultasi dengan calon siswa.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between gap-3">
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                                            >
                                                <RotateCcw size={13} /> Reset Simulasi
                                            </button>
                                            <Button
                                                type="button"
                                                onClick={onClose}
                                                variant="secondary"
                                                className="px-6 py-2.5 text-xs font-bold rounded-xl"
                                            >
                                                Tutup
                                            </Button>
                                        </div>
                                    </div>

                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
