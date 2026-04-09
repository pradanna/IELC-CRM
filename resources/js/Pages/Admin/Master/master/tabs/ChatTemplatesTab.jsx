import React, { useState, useMemo, useRef } from 'react';
import { useForm, router, usePage } from '@inertiajs/react';
import { Plus, X, Save, Loader2, Link as LinkIcon, File, Image as ImageIcon, Tag, Users, ShieldCheck } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import MasterTable from '../components/MasterTable';
import PremiumSearchableMultiSelect from '@/Components/PremiumSearchableMultiSelect';

export default function ChatTemplatesTab({ items }) {
    const { leadPhases, leadTypes, mediaAssets = [] } = usePage().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [copyFeedback, setCopyFeedback] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const messageRef = useRef(null);

    // Debounce search
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const handleInsertVariable = (variable) => {
        const textarea = messageRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = data.message;
        const before = text.substring(0, start);
        const after = text.substring(end);
        
        const newMessage = before + ` {{${variable}}} ` + after;
        setData('message', newMessage);

        // Reset focus and cursor after a slight delay (React state update compatible)
        setTimeout(() => {
            textarea.focus();
            const newPos = start + variable.length + 4; // {{ }} + space
            textarea.setSelectionRange(newPos, newPos);
        }, 10);
    };

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        title: '',
        message: '',
        lead_phase_ids: [],
        lead_type_ids: [],
    });

    const phaseOptions = leadPhases.map(p => ({ value: p.id, label: p.name }));
    const typeOptions = leadTypes.map(t => ({ value: t.id, label: t.name }));

    const openCreate = () => {
        setEditing(null);
        clearErrors();
        reset();
        setModalOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        clearErrors();
        setData({
            title: item.title,
            message: item.message,
            lead_phase_ids: item.lead_phases?.map(p => p.id) || [],
            lead_type_ids: item.lead_types?.map(t => t.id) || [],
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setSearchQuery('');
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const options = { onSuccess: closeModal, preserveScroll: true };
        if (editing) {
            put(route('admin.master.chat-templates.update', editing.id), options);
        } else {
            post(route('admin.master.chat-templates.store'), options);
        }
    };

    const handleDelete = (id, done) => {
        router.delete(route('admin.master.chat-templates.destroy', id), { onSuccess: done, onError: done });
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(id);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const isImage = (mime) => mime?.startsWith('image/');
    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024, dm = 2, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const filteredMedia = useMemo(() => {
        let results = mediaAssets;
        if (debouncedSearch) {
            results = results.filter(asset => 
                asset.name.toLowerCase().includes(debouncedSearch.toLowerCase())
            );
        }
        return results.slice(0, 5); // Max 5 results as requested
    }, [mediaAssets, debouncedSearch]);

    const columns = [
        { key: 'title', label: 'Judul Template' },
        {
            key: 'target_type',
            label: 'Target',
            render: row => {
                const globalPhase = !row.lead_phases || row.lead_phases.length === 0;
                const globalType = !row.lead_types || row.lead_types.length === 0;
                return (
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500">
                            Phases: {globalPhase ? <span className="italic">Global</span> : row.lead_phases.map(p => p.name).join(', ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                            Types: {globalType ? <span className="italic">Global</span> : row.lead_types.map(t => t.name).join(', ')}
                        </span>
                    </div>
                );
            },
        }
    ];

    return (
        <div className="space-y-6 outline-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Chat Templates</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Format MD Tersedia
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all shadow-lg"
                >
                    <Plus size={14} /> Buat Baru
                </button>
            </div>

            <MasterTable columns={columns} rows={items} onEdit={openEdit} onDelete={handleDelete} />

            <Transition.Root show={modalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-[60]" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
                                
                                {/* LEFT: FORM */}
                                <div className="flex-1 flex flex-col border-r border-slate-100 h-full overflow-y-auto">
                                    <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-10">
                                        <div>
                                            <Dialog.Title className="text-lg font-black text-slate-900">
                                                {editing ? 'Edit Chat Template' : 'Tambah Chat Template'}
                                            </Dialog.Title>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                {editing ? `Mengubah: ${editing.title}` : 'Buat template baru'}
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                                        <div className="px-8 py-6 space-y-5 flex-1">
                                            {/* Judul */}
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                    Judul Template <span className="text-red-500 ml-0.5">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.title}
                                                    onChange={e => setData('title', e.target.value)}
                                                    placeholder="e.g. Brosur TOEFL"
                                                    required
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                />
                                                {errors.title && <p className="text-xs text-red-500 font-bold mt-1.5">{errors.title}</p>}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {/* Phases */}
                                                <div className="relative z-50">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                        Target Lead Phase <span className="opacity-50">(Kosongkan = Global)</span>
                                                    </label>
                                                    <PremiumSearchableMultiSelect 
                                                        options={phaseOptions}
                                                        value={data.lead_phase_ids}
                                                        onChange={val => setData('lead_phase_ids', val)}
                                                        placeholder="Global"
                                                    />
                                                </div>

                                                {/* Types */}
                                                <div className="relative z-40">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                        Target Lead Type <span className="opacity-50">(Kosongkan = Global)</span>
                                                    </label>
                                                    <PremiumSearchableMultiSelect 
                                                        options={typeOptions}
                                                        value={data.lead_type_ids}
                                                        onChange={val => setData('lead_type_ids', val)}
                                                        placeholder="Global"
                                                    />
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <div className="flex-1 flex flex-col pt-2">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                        Pesan (Format WA) <span className="text-red-500 ml-0.5">*</span>
                                                    </label>
                                                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                                                        <button
                                                            type="button" onClick={() => handleInsertVariable('name')}
                                                            className="px-3 py-1 bg-white hover:bg-red-50 text-[9px] font-black text-slate-600 hover:text-red-600 rounded-lg shadow-sm border border-slate-100 transition-all flex items-center gap-1.5"
                                                        >
                                                            <Users size={10} /> Full Name
                                                        </button>
                                                        <button
                                                            type="button" onClick={() => handleInsertVariable('nickname')}
                                                            className="px-3 py-1 bg-white hover:bg-red-50 text-[9px] font-black text-slate-600 hover:text-red-600 rounded-lg shadow-sm border border-slate-100 transition-all flex items-center gap-1.5"
                                                        >
                                                            <Tag size={10} /> Nickname
                                                        </button>
                                                        <button
                                                            type="button" onClick={() => handleInsertVariable('lead_number')}
                                                            className="px-3 py-1 bg-white hover:bg-red-50 text-[9px] font-black text-slate-600 hover:text-red-600 rounded-lg shadow-sm border border-slate-100 transition-all flex items-center gap-1.5"
                                                        >
                                                            <LinkIcon size={10} /> Lead ID
                                                        </button>
                                                        <button
                                                            type="button" onClick={() => handleInsertVariable('admin_name')}
                                                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                                        >
                                                            <ShieldCheck size={10} /> Admin Name
                                                        </button>
                                                    </div>
                                                </div>
                                                <textarea
                                                    ref={messageRef}
                                                    value={data.message}
                                                    onChange={e => setData('message', e.target.value)}
                                                    placeholder="Halo kak {{name}}, berikut informasi..."
                                                    required
                                                    rows={10}
                                                    className="w-full flex-1 min-h-[200px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none shadow-inner"
                                                />
                                                <p className="mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                                    Variabel otomatis diganti saat dikirim. Jika nama kosong, otomatis menjadi "Kak"
                                                </p>
                                                {errors.message && <p className="text-xs text-red-500 font-bold mt-1.5">{errors.message}</p>}
                                            </div>
                                        </div>

                                        <div className="px-8 pb-6 pt-4 flex gap-3 border-t border-slate-50">
                                            <button
                                                type="button" onClick={closeModal}
                                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit" disabled={processing}
                                                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
                                            >
                                                {processing ? <Loader2 size={14} className="animate-spin" /> : (editing ? <Save size={14} /> : <Plus size={14} />)}
                                                {editing ? 'Simpan Perubahan' : 'Tambah Template'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* RIGHT: MEDIA ASSETS */}
                                <div className="w-full md:w-80 lg:w-96 bg-slate-50 flex flex-col h-full">
                                    <div className="px-6 pt-8 pb-4 border-b border-slate-200/50 sticky top-0 bg-slate-50 z-10 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900">Media Library</h3>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                    Copy link untuk disematkan
                                                </p>
                                            </div>
                                            <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all">
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* Search Input */}
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                placeholder="Cari media..." 
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm pl-9"
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                {debouncedSearch !== searchQuery ? <Loader2 size={14} className="animate-spin text-red-500" /> : <LinkIcon size={14} />}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {filteredMedia.length === 0 ? (
                                            <div className="py-20 text-center">
                                                <ImageIcon size={32} className="mx-auto text-slate-200 mb-4" />
                                                <p className="text-xs font-bold text-slate-400">Media tidak ditemukan.</p>
                                            </div>
                                        ) : (
                                            filteredMedia.map(asset => {
                                                const fileUrl = `${window.location.origin}/storage/${asset.file_path}`;
                                                return (
                                                    <div key={asset.id} className="bg-white border text-left border-slate-200 rounded-2xl p-3 flex items-start gap-3 transition-all hover:border-red-200 hover:shadow-md">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                            {isImage(asset.mime_type) ? <ImageIcon size={20} className="text-slate-400" /> : <File size={20} className="text-slate-400" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1" title={asset.name}>{asset.name}</h4>
                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 mb-2 line-clamp-1">
                                                                {formatBytes(asset.size)}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(fileUrl, asset.id)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
                                                            >
                                                                {copyFeedback === asset.id ? (
                                                                    <span className="text-emerald-500">Tersalin!</span>
                                                                ) : (
                                                                    <>
                                                                        <LinkIcon size={12} /> Copy Link
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>
        </div>
    );
}
