import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import MasterTable from '../components/MasterTable';
import MasterFormModal from '../components/MasterFormModal';

const FIELDS = [
    { key: 'name', label: 'Nama Source', placeholder: 'e.g. Instagram', required: true },
];

const columns = [
    { key: 'name', label: 'Nama Source' },
    {
        key: 'code',
        label: 'Kode',
        render: row => (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg tracking-widest">
                {row.code}
            </span>
        ),
    },
];

export default function LeadSourcesTab({ items }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({ name: '' });

    const openCreate = () => {
        setEditing(null);
        reset();
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setData({ name: item.name });
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
            put(route('admin.master.lead-sources.update', editing.id), { onSuccess: closeModal });
        } else {
            post(route('admin.master.lead-sources.store'), { onSuccess: closeModal });
        }
    };

    const handleDelete = (id, done) => {
        router.delete(route('admin.master.lead-sources.destroy', id), { onSuccess: done, onError: done });
    };

    return (
        <div className="space-y-6 outline-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {items.length} source terdaftar
                </p>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg"
                >
                    <Plus size={14} /> Tambah Source
                </button>
            </div>

            <MasterTable columns={columns} rows={items} onEdit={openEdit} onDelete={handleDelete} />

            <MasterFormModal
                isOpen={modalOpen}
                onClose={closeModal}
                title="Lead Source"
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
