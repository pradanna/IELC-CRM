import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import InputLabel from '@/Components/form/InputLabel';
import TextInput from '@/Components/form/TextInput';
import InputError from '@/Components/form/InputError';
import SecondaryButton from '@/Components/form/SecondaryButton';
import PrimaryButton from '@/Components/form/PrimaryButton';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import TextArea from '@/Components/ui/TextArea';
import { BookOpen, Tag, DollarSign, Calculator, Calendar, Loader2, Save, Plus, Trash2, X } from 'lucide-react';

export default function PlotAndInvoiceModal({ show, onClose, lead, classes = [], priceMasters = [] }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        lead_id: '',
        study_class_id: '',
        price_master_id: '',
        notes: '',
        items: [],
    });

    const classList = useMemo(() => Array.isArray(classes) ? classes : [], [classes]);
    const priceMasterList = useMemo(() => Array.isArray(priceMasters) ? priceMasters : [], [priceMasters]);

    useEffect(() => {
        if (show && lead) {
            const classId = lead.plotting?.study_class_id || '';
            const existingNotes = lead.plotting?.notes || '';
            
            // Derive price_master_id from the class if available
            let priceId = '';
            if (classId && classList.length > 0) {
                const cls = classList.find(c => c.id === classId);
                if (cls) {
                    priceId = cls.price_master_id || '';
                }
            }

            setData({
                ...data,
                lead_id: lead.id,
                study_class_id: classId,
                price_master_id: priceId,
                notes: existingNotes,
            });
        }
    }, [show, lead, classList]);

    const selectedClass = useMemo(() => {
        return classList.find(c => c.id === data.study_class_id);
    }, [data.study_class_id, classList]);

    const selectedPrice = useMemo(() => {
        return priceMasterList.find(p => p.id === data.price_master_id);
    }, [data.price_master_id, priceMasterList]);

    const remainingSessions = useMemo(() => {
        // Priority 1: Use the remaining meetings saved during Lead Plotting
        if (lead?.plotting?.remaining_meetings && lead.plotting.study_class_id === data.study_class_id) {
            return Number(lead.plotting.remaining_meetings);
        }

        // Priority 2: Standard calculation if plotting data missing or class changed
        if (!selectedClass) return 0;
        return Math.max(0, (selectedClass.total_meetings || 0) - (selectedClass.current_session_number || 0));
    }, [selectedClass, lead, data.study_class_id]);

    const baseClassSubtotal = useMemo(() => {
        if (!selectedPrice || !remainingSessions || !selectedClass?.total_meetings) return 0;
        const rate = (selectedPrice.price_per_session || 0) / (selectedClass.total_meetings || 1);
        return Math.round(remainingSessions * rate);
    }, [selectedPrice, remainingSessions, selectedClass]);

    const itemsTotal = useMemo(() => {
        return (data.items || []).reduce((sum, item) => sum + (Number(item.unit_price || 0) * Number(item.quantity || 1)), 0);
    }, [data.items]);

    const totalAmount = useMemo(() => baseClassSubtotal + itemsTotal, [baseClassSubtotal, itemsTotal]);

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
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Plotting lead: {lead?.name}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="px-8 py-10 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <InputLabel value="1. Seleksi Kelas" className="uppercase text-[10px] tracking-widest font-black text-slate-400" />
                                                <PremiumSearchableSelect
                                                    options={classOptions}
                                                    value={data.study_class_id}
                                                    onChange={(val) => setData('study_class_id', val)}
                                                    icon={BookOpen}
                                                    placeholder="Cari kelas..."
                                                />
                                                <InputError message={errors.study_class_id} />
                                            </div>
                                            <div className="space-y-3">
                                                <InputLabel value="2. Seleksi Harga" className="uppercase text-[10px] tracking-widest font-black text-slate-400" />
                                                <PremiumSearchableSelect
                                                    options={priceOptions}
                                                    value={data.price_master_id}
                                                    onChange={(val) => setData('price_master_id', val)}
                                                    icon={Tag}
                                                    placeholder="Cari kategori..."
                                                />
                                                <InputError message={errors.price_master_id} />
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Addons & Extras</h3>
                                                    <p className="text-[9px] font-bold text-slate-400 italic">Tambahkan biaya lain jika diperlukan</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => addItem('Placement Test Fee', 50000)} 
                                                        className="group flex items-center gap-2 text-[9px] font-black px-3.5 py-2 bg-indigo-50 text-indigo-600 rounded-xl uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                    >
                                                        <Plus size={12} className="group-hover:rotate-90 transition-transform" />
                                                        Placement
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => addItem('', 0)} 
                                                        className="group flex items-center gap-2 text-[9px] font-black px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                                    >
                                                        <Plus size={12} className="group-hover:rotate-90 transition-transform" />
                                                        Custom
                                                    </button>
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
                                                                    value={item.name} 
                                                                    onChange={e => { const n = [...data.items]; n[idx].name = e.target.value; setData('items', n); }} 
                                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:italic p-0" 
                                                                    placeholder="Nama biaya tambahan..." 
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">Rp</span>
                                                                    <input 
                                                                        type="number" 
                                                                        value={item.unit_price} 
                                                                        onChange={e => { const n = [...data.items]; n[idx].unit_price = e.target.value; setData('items', n); }} 
                                                                        className="w-28 bg-transparent border-none focus:ring-0 text-sm font-black text-slate-900 text-right p-0 pl-6" 
                                                                        placeholder="0" 
                                                                    />
                                                                </div>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setData('items', data.items.filter((_, i) => i !== idx))} 
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <Trash2 size={14}/>
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
                                                </div>
                                                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoice Amount</span>
                                                        <p className="text-[8px] font-bold text-emerald-600 uppercase mt-1 tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">Awaiting Confirmation</p>
                                                    </div>
                                                    <span className="text-4xl font-black tracking-tighter text-red-600">{formatCurrency(totalAmount)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <InputLabel value="Catatan Internal" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                                            <TextArea value={data.notes} onChange={e => setData('notes', e.target.value)} className="bg-slate-50 border-none rounded-2xl text-[11px] font-bold" rows={2} placeholder="Opsional..." />
                                        </div>
                                    </div>

                                    <div className="px-8 py-8 bg-slate-50 flex items-center justify-end gap-3 rounded-b-[32px]">
                                        <SecondaryButton onClick={onClose} className="!rounded-2xl !text-[10px] uppercase tracking-widest font-black px-6 py-3.5">Batal</SecondaryButton>
                                        <PrimaryButton disabled={processing || !selectedClass || !selectedPrice} className="!bg-red-600 hover:!bg-red-700 !rounded-2xl !text-[10px] uppercase tracking-widest font-black px-10 py-3.5 shadow-xl shadow-red-600/30">
                                            {processing ? <Loader2 className="animate-spin mr-2" size={14} /> : <Save className="mr-2" size={14} />}
                                            Generate Invoice
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
