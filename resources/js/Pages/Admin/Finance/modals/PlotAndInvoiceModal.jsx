import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import PremiumSelect from '@/Components/PremiumSelect';
import { BookOpen, Tag, DollarSign, Calculator, Calendar } from 'lucide-react';

export default function PlotAndInvoiceModal({ show, onClose, lead, classes, priceMasters }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        lead_id: '',
        study_class_id: '',
        price_master_id: '',
        notes: '',
    });

    // Set lead_id when modal opens
    useEffect(() => {
        if (show && lead) {
            setData('lead_id', lead.id);
        }
    }, [show, lead]);

    const selectedClass = useMemo(() => {
        return classes.find(c => c.id === data.study_class_id);
    }, [data.study_class_id, classes]);

    const selectedPrice = useMemo(() => {
        return priceMasters.find(p => p.id === data.price_master_id);
    }, [data.price_master_id, priceMasters]);

    // Calculate remaining sessions
    const remainingSessions = useMemo(() => {
        if (!selectedClass) return 0;
        const total = selectedClass.total_meetings;
        const passed = selectedClass.session_progress;
        return Math.max(0, total - passed);
    }, [selectedClass]);

    const totalAmount = useMemo(() => {
        if (!selectedPrice || !remainingSessions) return 0;
        return remainingSessions * selectedPrice.price_per_session;
    }, [selectedPrice, remainingSessions]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.finance.invoices.generate'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <form onSubmit={submit} className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            Plot & <span className="text-red-600">Invoice</span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Assigning: <span className="text-slate-900">{lead?.name}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Class Selection */}
                    <div>
                        <InputLabel className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" value="Select Target Class" />
                        <PremiumSelect
                            options={classes.map(c => ({
                                value: c.id,
                                label: `${c.name} - Cycle #${c.current_session_number} (${c.branch?.name})`
                            }))}
                            value={data.study_class_id}
                            onChange={(val) => setData('study_class_id', val)}
                            icon={BookOpen}
                            placeholder="Choose a class tracking..."
                        />
                        <InputError message={errors.study_class_id} className="mt-2" />
                    </div>

                    {/* Price Category Selection */}
                    <div>
                        <InputLabel className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" value="Pricing Category" />
                        <PremiumSelect
                            options={priceMasters.map(p => ({
                                value: p.id,
                                label: `${p.name} (${formatCurrency(p.price_per_session)} / session)`
                            }))}
                            value={data.price_master_id}
                            onChange={(val) => setData('price_master_id', val)}
                            icon={Tag}
                            placeholder="Choose a pricing rate..."
                        />
                        <InputError message={errors.price_master_id} className="mt-2" />
                    </div>

                    {/* Calculation Summary Card */}
                    {selectedClass && selectedPrice && (
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest pb-4 border-b border-slate-200/50">
                                <span>Summary Calculation</span>
                                <Calculator className="w-4 h-4" />
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-500">Remaining Sessions</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900">{remainingSessions}</span>
                                        <span className="text-[10px] text-slate-400 uppercase">meetings</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-500">Rate per Session</span>
                                    <span className="text-sm font-black text-slate-900">{formatCurrency(selectedPrice.price_per_session)}</span>
                                </div>
                                <div className="pt-4 flex justify-between items-center border-t border-slate-200">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-xl font-black text-red-600">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <InputLabel htmlFor="notes" value="Internal Notes" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <textarea
                            id="notes"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            className="w-full rounded-2xl bg-slate-50 border-none py-4 font-bold text-slate-900 focus:ring-red-500/10 min-h-[100px]"
                            placeholder="Optional notes for this invoice..."
                        />
                        <InputError message={errors.notes} className="mt-2" />
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-end gap-3">
                    <SecondaryButton onClick={onClose} className="!rounded-xl uppercase tracking-widest font-black text-[10px] px-6 py-3">Cancel</SecondaryButton>
                    <PrimaryButton 
                        disabled={processing || !selectedClass || !selectedPrice} 
                        className="!bg-slate-900 hover:!bg-red-600 !rounded-xl uppercase tracking-widest font-black text-[10px] px-8 py-3 shadow-lg shadow-slate-900/10 transition-all"
                    >
                        {processing ? 'Processing...' : 'Generate Invoice'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
