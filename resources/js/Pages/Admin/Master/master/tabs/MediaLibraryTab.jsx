import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Plus, Link as LinkIcon, Download, Trash2, File, Image as ImageIcon } from 'lucide-react';
import MasterFormModal from '../components/MasterFormModal';

export default function MediaLibraryTab({ items }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        file: null,
    });

    const fields = [
        { key: 'name', label: 'Nama Deskriptif', placeholder: 'e.g. Brosur Promo Ramadhan', required: true },
        { key: 'file', label: 'Pilih File (Max 10MB)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp', placeholder: 'Pilih file...', required: true },
    ];

    const openCreate = () => {
        clearErrors();
        reset();
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.master.media-assets.store'), {
            onSuccess: closeModal,
            preserveScroll: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus media ini?')) {
            router.delete(route('admin.master.media-assets.destroy', id), { preserveScroll: true });
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(id);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024, dm = 2, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const isImage = (mime) => mime?.startsWith('image/');

    return (
        <div className="space-y-6 outline-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Media Library</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Penyimpanan Brosur & Dokumen
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                    <Plus size={14} /> Upload Media Baru
                </button>
            </div>

            {/* Grid */}
            {items.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                    <p className="text-sm font-bold text-slate-400">Belum ada media. Upload brosur pertamamu!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(asset => {
                        const fileUrl = `${window.location.origin}/storage/${asset.file_path}`;
                        return (
                            <div key={asset.id} className="bg-white rounded-3xl border border-slate-100 p-4 transition-all hover:shadow-xl hover:shadow-slate-200/50 group flex flex-col justify-between">
                                <div>
                                    <div className="aspect-video bg-slate-50 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border border-slate-100">
                                        {isImage(asset.mime_type) ? (
                                            <ImageIcon size={32} className="text-slate-300" />
                                        ) : (
                                            <File size={32} className="text-slate-300" />
                                        )}
                                    </div>
                                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1" title={asset.name}>{asset.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-2 line-clamp-1" title={asset.file_name}>
                                        {asset.file_name} • {formatBytes(asset.size)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                    <button
                                        onClick={() => copyToClipboard(fileUrl, asset.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
                                    >
                                        {copyFeedback === asset.id ? (
                                            <span className="text-emerald-500">Link Tersalin!</span>
                                        ) : (
                                            <>
                                                <LinkIcon size={12} /> Copy Link
                                            </>
                                        )}
                                    </button>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                        title="Download/Buka"
                                    >
                                        <Download size={14} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(asset.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Hapus"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <MasterFormModal
                isOpen={modalOpen}
                onClose={closeModal}
                title="Media Asset"
                editing={null} // Only strictly create
                fields={fields}
                data={data}
                setData={(key, val) => setData(key, val)}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
