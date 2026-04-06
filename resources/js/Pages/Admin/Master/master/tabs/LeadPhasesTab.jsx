import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import MasterTable from '../components/MasterTable';
import MasterFormModal from '../components/MasterFormModal';

const STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'prospective', label: 'Prospective' },
    { value: 'closing', label: 'Closing' },
    { value: 'lost', label: 'Lost' },
];

const STATUS_COLORS = {
    new:         'bg-sky-50 text-sky-700 border border-sky-100',
    prospective: 'bg-amber-50 text-amber-700 border border-amber-100',
    closing:     'bg-emerald-50 text-emerald-700 border border-emerald-100',
    lost:        'bg-slate-50 text-slate-500 border border-slate-200',
};

const FIELDS = [
    { key: 'name',   label: 'Nama Phase',      placeholder: 'e.g. Prospect', required: true },
    { key: 'status', label: 'Status Pipeline', type: 'select', options: STATUS_OPTIONS, placeholder: 'Pilih status...', required: true },
];

const columns = [
    { key: 'name', label: 'Nama Phase' },
    {
        key: 'code',
        label: 'Kode',
        render: row => (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg tracking-widest">
                {row.code}
            </span>
        ),
    },
    {
        key: 'status',
        label: 'Status',
        render: row => (
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${STATUS_COLORS[row.status] || 'bg-slate-50 text-slate-400'}`}>
                {row.status}
            </span>
        ),
    },
];

export default function LeadPhasesTab({ items }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ name: '', status: 'new' });

    const openCreate = () => {
        setEditing(null);
        reset();
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setData({ name: item.name, status: item.status });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.master.lead-phases.update', editing.id), { onSuccess: closeModal });
        } else {
            post(route('admin.master.lead-phases.store'), { onSuccess: closeModal });
        }
    };

    const handleDelete = (id, done) => {
        router.delete(route('admin.master.lead-phases.destroy', id), { onSuccess: done, onError: done });
    };

    return (
        <div className="space-y-6 outline-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {items.length} phase terdaftar
                </p>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg"
                >
                    <Plus size={14} /> Tambah Phase
                </button>
            </div>

            <MasterTable columns={columns} rows={items} onEdit={openEdit} onDelete={handleDelete} />

            <MasterFormModal
                isOpen={modalOpen}
                onClose={closeModal}
                title="Lead Phase"
                editing={editing}
                fields={FIELDS}
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
