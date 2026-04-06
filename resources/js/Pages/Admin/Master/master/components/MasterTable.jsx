import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function MasterTable({ columns, rows, onEdit, onDelete }) {
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleConfirmDelete = () => {
        setDeleting(true);
        onDelete(deleteTarget.id, () => {
            setDeleteTarget(null);
            setDeleting(false);
        });
    };

    return (
        <>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-50">
                            {columns.map(col => (
                                <th key={col.key} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-8 py-16 text-center text-sm font-medium text-slate-400">
                                    Belum ada data. Tambahkan item baru melalui form di sebelah.
                                </td>
                            </tr>
                        ) : rows.map(row => (
                            <tr key={row.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                                {columns.map(col => (
                                    <td key={col.key} className="px-8 py-5">
                                        {col.render ? col.render(row) : (
                                            <span className="text-sm font-bold text-slate-700">{row[col.key]}</span>
                                        )}
                                    </td>
                                ))}
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onEdit(row)}
                                            title="Edit"
                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(row)}
                                            title="Hapus"
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDeleteModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                label={deleteTarget?.name}
                processing={deleting}
            />
        </>
    );
}
