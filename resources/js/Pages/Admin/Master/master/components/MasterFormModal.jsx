import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Save, Plus, Loader2 } from 'lucide-react';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';

/**
 * Generic master data form modal.
 *
 * Props:
 *  - isOpen: bool
 *  - onClose: fn
 *  - title: string (e.g. "Lead Type")
 *  - editing: object | null
 *  - fields: [ { key, label, placeholder, required, type?, options? } ]
 *    - type 'select'  → renders PremiumSearchableSelect
 *    - type 'hidden'  → skipped (used to exclude code from UI while still being in data)
 *    - default        → text input
 *  - data: object  (from useForm)
 *  - setData: fn
 *  - errors: object
 *  - processing: bool
 *  - onSubmit: fn (e)
 */
export default function MasterFormModal({ isOpen, onClose, title, editing, fields, data, setData, errors, processing, onSubmit }) {
    const visibleFields = fields.filter(f => f.type !== 'hidden');

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
                {/* Backdrop */}
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
                        <Dialog.Panel className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-8 pt-8 pb-6 flex items-center justify-between border-b border-slate-50">
                                <div>
                                    <Dialog.Title className="text-lg font-black text-slate-900">
                                        {editing ? `Edit ${title}` : `Tambah ${title}`}
                                    </Dialog.Title>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                        {editing ? `Mengubah: ${editing.name}` : `Buat ${title.toLowerCase()} baru`}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={onSubmit}>
                                <div className="px-8 py-6 space-y-5">
                                    {visibleFields.map(field => (
                                        <div key={field.key}>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                                            </label>

                                            {field.type === 'multi-select' ? (
                                                <select
                                                    multiple
                                                    value={data[field.key] || []}
                                                    onChange={e => {
                                                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                                                        setData(field.key, selected);
                                                    }}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all h-32"
                                                >
                                                    {field.options.map(opt => (
                                                        <option key={opt.value} value={opt.value} className="py-2 px-2 hover:bg-slate-100 rounded-lg">{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'select' ? (
                                                <PremiumSearchableSelect
                                                    options={field.options}
                                                    value={data[field.key]}
                                                    onChange={val => setData(field.key, val)}
                                                    placeholder={field.placeholder || `Pilih ${field.label}...`}
                                                />
                                            ) : field.type === 'textarea' ? (
                                                <textarea
                                                    value={data[field.key] ?? ''}
                                                    onChange={e => setData(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    required={field.required}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                                                />
                                            ) : field.type === 'file' ? (
                                                <input
                                                    type="file"
                                                    onChange={e => setData(field.key, e.target.files[0])}
                                                    required={field.required && !editing}
                                                    accept={field.accept}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={data[field.key] ?? ''}
                                                    onChange={e => setData(field.key, e.target.value)}
                                                    placeholder={field.placeholder}
                                                    required={field.required}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                />
                                            )}

                                            {errors[field.key] && (
                                                <p className="text-xs text-red-500 font-bold mt-1.5">{errors[field.key]}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="px-8 pb-8 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        {processing
                                            ? <Loader2 size={14} className="animate-spin" />
                                            : editing ? <Save size={14} /> : <Plus size={14} />
                                        }
                                        {editing ? 'Simpan Perubahan' : `Tambah ${title}`}
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
