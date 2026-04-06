import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Calendar, Target, Building2 } from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import PremiumSelect from '@/Components/PremiumSelect';

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

export default function MonthlyTargetsTab({ items = [], branches = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        branch_id: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        target_enrolled: '',
    });

    const openModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setData({
                branch_id: item.branch_id,
                year: item.year,
                month: item.month,
                target_enrolled: item.target_enrolled,
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
        if (editingItem) {
            put(route('admin.master.monthly-targets.update', editingItem.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.master.monthly-targets.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this monthly target?')) {
            destroy(route('admin.master.monthly-targets.destroy', id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Monthly Enrollment Targets</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Set goals across all branches</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                >
                    <Plus size={14} />
                    <span>Add New Target</span>
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Branch</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Period</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Target</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.length > 0 ? items.map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                            <Building2 size={14} />
                                        </div>
                                        <span className="text-sm font-black text-slate-900 uppercase">{item.branch?.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-900 uppercase">
                                            {MONTHS.find(m => m.value === item.month)?.label}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 tracking-widest">{item.year}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                        <Target size={12} className="opacity-50" />
                                        <span className="text-xs font-black tracking-tight">{item.target_enrolled} Siswa</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="px-8 py-20 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                    No targets configured yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal show={isModalOpen} onClose={closeModal} maxWidth="xl">
                <form onSubmit={submit} className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                {editingItem ? 'Update' : 'Set'} <span className="text-red-600">Monthly Target</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure goals for specific periods</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <InputLabel className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" value="Branch" />
                            <PremiumSelect
                                options={branches.map(b => ({ value: b.id, label: b.name }))}
                                value={data.branch_id}
                                onChange={(val) => setData('branch_id', val)}
                                icon={Building2}
                                placeholder="Choose a branch..."
                            />
                            <InputError message={errors.branch_id} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" value="Month" />
                                <PremiumSelect
                                    options={MONTHS}
                                    value={data.month}
                                    onChange={(val) => setData('month', val)}
                                    icon={Calendar}
                                    placeholder="Select Month"
                                />
                                <InputError message={errors.month} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2" value="Year" />
                                <PremiumSelect
                                    options={YEARS.map(y => ({ value: y, label: y.toString() }))}
                                    value={data.year}
                                    onChange={(val) => setData('year', val)}
                                    icon={Calendar}
                                    placeholder="Select Year"
                                />
                                <InputError message={errors.year} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="target" className="uppercase text-[10px] tracking-widest font-black text-slate-400 mb-2 text-slate-900" value="Enrollment Target (Number of Students)" />
                            <TextInput
                                id="target"
                                type="number"
                                value={data.target_enrolled}
                                onChange={(e) => setData('target_enrolled', e.target.value)}
                                className="w-full !rounded-2xl !bg-slate-50 border-none !py-4 font-bold text-slate-900"
                                placeholder="e.g. 50"
                            />
                            <InputError message={errors.target_enrolled} className="mt-2" />
                        </div>
                    </div>

                    <div className="mt-10 flex items-center justify-end gap-3">
                        <SecondaryButton onClick={closeModal} className="!rounded-xl uppercase tracking-widest font-black text-[10px] px-6 py-3">Cancel</SecondaryButton>
                        <PrimaryButton disabled={processing} className="!bg-slate-900 hover:!bg-red-600 !rounded-xl uppercase tracking-widest font-black text-[10px] px-8 py-3 shadow-lg shadow-slate-900/10 transition-all">
                            {editingItem ? 'Update Target' : 'Save Target'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
