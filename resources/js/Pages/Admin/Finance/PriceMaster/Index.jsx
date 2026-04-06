import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Tag, DollarSign, Package } from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Index({ priceMasters }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        price_per_session: '',
    });

    const openModal = (priceItem = null) => {
        setEditingPrice(priceItem);
        if (priceItem) {
            setData({
                name: priceItem.name,
                price_per_session: priceItem.price_per_session,
            });
        } else {
            reset();
        }
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingPrice) {
            patch(route('admin.finance.price-masters.update', editingPrice.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.finance.price-masters.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this price master?')) {
            destroy(route('admin.finance.price-masters.destroy', id));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <AdminLayout>
            <Head title="Price Master" />

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            Price <span className="text-red-600">Master</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />
                            Manage session rates for all tracks
                        </p>
                    </div>

                    <button 
                        onClick={() => openModal()}
                        className="group flex items-center gap-2 bg-slate-900 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>CREATE NEW PRICE</span>
                    </button>
                </div>

                {/* Price List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-900">
                    {priceMasters.map((pm) => (
                        <div key={pm.id} className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => openModal(pm)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(pm.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                    <Tag className="w-6 h-6" />
                                </div>
                                
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">{pm.name}</h3>
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-lg border border-emerald-100">
                                            {formatCurrency(pm.price_per_session)}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">per session</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {priceMasters.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-200">
                        <div className="p-8 bg-white rounded-full shadow-xl shadow-slate-200/50">
                            <DollarSign className="w-12 h-12 text-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">No pricing records found</h3>
                            <p className="text-slate-400 max-w-xs font-medium italic">Define your first product pricing to enable invoicing features.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Price Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="xl">
                <form onSubmit={submit} className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <Tag size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                {editingPrice ? 'Update' : 'Create'} <span className="text-red-600">Price Master</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure session rates</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value="Name (e.g. Group Class, IELTS Priv)" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 font-bold text-slate-900"
                                placeholder="Enter track name..."
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
                                    className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 !pl-12 font-bold text-slate-900"
                                    placeholder="0"
                                />
                            </div>
                            <InputError message={errors.price_per_session} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-10 flex items-center justify-end gap-3">
                        <SecondaryButton onClick={closeModal} className="!rounded-xl uppercase tracking-widest font-black text-[10px] px-6 py-3">Cancel</SecondaryButton>
                        <PrimaryButton disabled={processing} className="!bg-red-600 hover:!bg-red-700 !rounded-xl uppercase tracking-widest font-black text-[10px] px-8 py-3 shadow-lg shadow-red-600/20">
                            {editingPrice ? 'Update Rate' : 'Save Rate'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
