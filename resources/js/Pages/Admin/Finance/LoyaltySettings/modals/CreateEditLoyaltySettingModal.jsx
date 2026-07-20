import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import Checkbox from '@/Components/form/Checkbox';
import DatePicker from '@/Components/form/DatePicker';
import { Award, Gift, Coffee, Tag, Loader2, Save } from 'lucide-react';

export default function CreateEditLoyaltySettingModal({ isOpen, onClose, settingItem = null, isReadOnly = false }) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        tier_name: '',
        voucher_name: '',
        discount_amount: '',
        cafe_points: '',
        min_rejoin_count: '',
        use_join_date_limit: false,
        join_date_limit: '',
        join_date_operator: 'before',
    });

    useEffect(() => {
        if (isOpen) {
            clearErrors();
            if (settingItem) {
                setData({
                    tier_name: settingItem.tier_name,
                    voucher_name: settingItem.voucher_name,
                    discount_amount: settingItem.discount_amount,
                    cafe_points: settingItem.cafe_points,
                    min_rejoin_count: settingItem.min_rejoin_count,
                    use_join_date_limit: !!settingItem.use_join_date_limit,
                    join_date_limit: settingItem.join_date_limit || '',
                    join_date_operator: settingItem.join_date_operator || 'before',
                });
            } else {
                reset();
            }
        }
    }, [isOpen, settingItem]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isReadOnly) return;
        
        const options = {
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (settingItem) {
            put(route('admin.finance.loyalty-settings.update', settingItem.id), options);
        } else {
            post(route('admin.finance.loyalty-settings.store'), options);
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
                        <Award size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                            {isReadOnly ? 'Detail' : (settingItem ? 'Update' : 'Create')} <span className="text-red-600">Loyalty Tier</span>
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure student rejoin loyalty rules</p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Tier Name */}
                    <div>
                        <InputLabel htmlFor="tier_name" value="Nama Tingkatan Tier" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <div className="relative">
                            <TextInput
                                id="tier_name"
                                value={data.tier_name}
                                onChange={(e) => setData('tier_name', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 pl-12 font-bold text-slate-900 shadow-sm focus:ring-red-500 disabled:opacity-70"
                                placeholder="e.g. Silver, Gold, Platinum..."
                                disabled={isReadOnly}
                            />
                            <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <InputError message={errors.tier_name} className="mt-2" />
                    </div>

                    {/* Min Rejoin Count */}
                    <div>
                        <InputLabel htmlFor="min_rejoin_count" value="Min Rejoin Count" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <div className="relative">
                            <TextInput
                                id="min_rejoin_count"
                                type="number"
                                value={data.min_rejoin_count}
                                onChange={(e) => setData('min_rejoin_count', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 pl-6 pr-16 font-bold text-slate-900 shadow-sm focus:ring-red-500 disabled:opacity-70"
                                placeholder="0"
                                min="0"
                                disabled={isReadOnly}
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                                Joins
                            </div>
                        </div>
                        <InputError message={errors.min_rejoin_count} className="mt-2" />
                    </div>

                    {/* Batasan Tanggal Gabung */}
                    <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="use_join_date_limit"
                                checked={data.use_join_date_limit}
                                onChange={(e) => setData('use_join_date_limit', e.target.checked)}
                                disabled={isReadOnly}
                                className="h-5 w-5 rounded-lg border-slate-300 text-red-600 focus:ring-red-500 disabled:opacity-70 cursor-pointer"
                            />
                            <InputLabel htmlFor="use_join_date_limit" value="Batasi Berdasarkan Tanggal Gabung Siswa" className="uppercase text-[10px] tracking-widest font-black text-slate-600 select-none cursor-pointer" />
                        </div>
                        <InputError message={errors.use_join_date_limit} className="mt-2" />

                        {data.use_join_date_limit && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <InputLabel htmlFor="join_date_operator" value="Kondisi Tanggal" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                                    <select
                                        id="join_date_operator"
                                        value={data.join_date_operator}
                                        onChange={(e) => setData('join_date_operator', e.target.value)}
                                        disabled={isReadOnly}
                                        className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 px-4 font-bold text-slate-900 shadow-sm focus:ring-red-500 disabled:opacity-70 text-sm appearance-none"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                            backgroundPosition: 'right 1rem center',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundSize: '1.25em 1.25em',
                                        }}
                                    >
                                        <option value="before">Sebelum (Sebelum tanggal)</option>
                                        <option value="after">Setelah atau Sama Dengan (Mulai tanggal)</option>
                                    </select>
                                    <InputError message={errors.join_date_operator} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="join_date_limit" value="Batas Tanggal Gabung" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                                    <DatePicker
                                        id="join_date_limit"
                                        value={data.join_date_limit}
                                        onChange={(date) => setData('join_date_limit', date)}
                                        placeholder="Pilih tanggal batas..."
                                        disabled={isReadOnly}
                                        inputClassName="!rounded-2xl !bg-slate-50 border-none !py-4 pl-6 shadow-sm focus:ring-red-500 disabled:opacity-70 font-bold"
                                    />
                                    <InputError message={errors.join_date_limit} className="mt-2" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Voucher Name */}
                    <div>
                        <InputLabel htmlFor="voucher_name" value="Voucher yang Didapat" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <div className="relative">
                            <TextInput
                                id="voucher_name"
                                value={data.voucher_name}
                                onChange={(e) => setData('voucher_name', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 pl-12 font-bold text-slate-900 shadow-sm focus:ring-red-500 disabled:opacity-70"
                                placeholder="e.g. Ruby, Emerald, Diamond..."
                                disabled={isReadOnly}
                            />
                            <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <InputError message={errors.voucher_name} className="mt-2" />
                    </div>

                    {/* Discount Amount */}
                    <div>
                        <InputLabel htmlFor="discount_amount" value="Diskon Tagihan (IDR)" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                            <TextInput
                                id="discount_amount"
                                type="number"
                                value={data.discount_amount}
                                onChange={(e) => setData('discount_amount', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 !pl-12 font-bold text-slate-900 shadow-sm focus:ring-red-500 disabled:opacity-70"
                                placeholder="0"
                                min="0"
                                disabled={isReadOnly}
                            />
                            <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <InputError message={errors.discount_amount} className="mt-2" />
                    </div>

                    {/* Cafe Voucher Amount */}
                    <div>
                        <InputLabel htmlFor="cafe_points" value="Nilai Voucher Cafe (IDR)" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                            <TextInput
                                id="cafe_points"
                                type="number"
                                value={data.cafe_points}
                                onChange={(e) => setData('cafe_points', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 !pl-12 font-bold text-slate-900 shadow-sm focus:ring-red-500 disabled:opacity-70"
                                placeholder="0"
                                min="0"
                                disabled={isReadOnly}
                            />
                            <Coffee className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <InputError message={errors.cafe_points} className="mt-2" />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-10 flex items-center justify-end gap-3">
                    {isReadOnly ? (
                        <PrimaryButton 
                            type="button"
                            onClick={onClose}
                            className="!bg-slate-700 hover:!bg-slate-800 !rounded-xl uppercase tracking-widest font-black text-[10px] px-8 py-3"
                        >
                            Tutup Detail
                        </PrimaryButton>
                    ) : (
                        <>
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
                                {settingItem ? 'Update Tier' : 'Save Tier'}
                            </PrimaryButton>
                        </>
                    )}
                </div>
            </form>
        </Modal>
    );
}
