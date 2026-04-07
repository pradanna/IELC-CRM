import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import { Tag, DollarSign, Loader2, Save } from 'lucide-react';

export default function CreateEditPriceMasterModal({ isOpen, onClose, priceItem = null }) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        name: '',
        price_per_session: '',
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            if (priceItem) {
                setData({
                    name: priceItem.name,
                    price_per_session: priceItem.price_per_session,
                });
            } else {
                reset();
            }
        }
    }, [isOpen, priceItem]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const options = {
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (priceItem) {
            patch(route('admin.finance.price-masters.update', priceItem.id), options);
        } else {
            post(route('admin.finance.price-masters.store'), options);
        }
    };

    return (
        <Modal 
            show={isOpen} 
            onClose={onClose} 
            maxWidth="xl"
        >
            <form onSubmit={handleSubmit} className="p-2">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                        <Tag size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            {priceItem ? 'Update' : 'Create'} <span className="text-red-600">Price Master</span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure session rates for invoicing</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value="Product/Track Name" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <TextInput
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 font-bold text-slate-900 shadow-sm focus:ring-red-500"
                            placeholder="e.g. Group Class, IELTS Private..."
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="price" value="Price per Session (IDR)" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                            <TextInput
                                id="price"
                                type="number"
                                value={data.price_per_session}
                                onChange={(e) => setData('price_per_session', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 !pl-12 font-bold text-slate-900 shadow-sm focus:ring-red-500"
                                placeholder="0"
                            />
                        </div>
                        <InputError message={errors.price_per_session} className="mt-2" />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex items-center justify-end gap-3">
                    <SecondaryButton 
                        type="button" 
                        onClick={onClose} 
                        className="!rounded-xl uppercase tracking-widest font-black text-[10px] px-6 py-3"
                    >
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton 
                        disabled={processing} 
                        className="!bg-red-600 hover:!bg-red-700 !rounded-xl uppercase tracking-widest font-black text-[10px] px-8 py-3 shadow-lg shadow-red-600/20"
                    >
                        {processing ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {priceItem ? 'Update Rate' : 'Save Rate'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
