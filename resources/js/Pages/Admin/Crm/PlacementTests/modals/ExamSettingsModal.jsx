import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import TextArea from '@/Components/ui/TextArea';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import Checkbox from '@/Components/form/Checkbox';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function ExamSettingsModal({ show, onClose, form, onSubmit, onDelete, hasSessions = false }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-8">
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">Package Settings</h2>
                <p className="text-xs text-slate-400 mb-6">Edit exam package configuration</p>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div>
                        <InputLabel value="Package Title" />
                        <TextInput
                            className="mt-1"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                            required
                        />
                        <InputError message={form.errors.title} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel value="Package Category" />
                        <select 
                            className="mt-1 w-full border-slate-200 focus:border-red-500 focus:ring-red-500 rounded-2xl shadow-sm bg-slate-50 border px-4 py-2.5 text-sm font-bold"
                            value={form.data.category}
                            onChange={(e) => form.setData('category', e.target.value)}
                            required
                        >
                            <option value="General">General / Adult Placement</option>
                            <option value="Kids">Kids Placement (Interactive / Drag & Drop)</option>
                            <option value="Teens">Teens Placement</option>
                            <option value="IELTS">IELTS Assessment (Task-based)</option>
                        </select>
                        <InputError message={form.errors.category} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Duration (Minutes)" />
                            <TextInput
                                type="number"
                                className="mt-1"
                                value={form.data.duration_minutes}
                                onChange={(e) => form.setData('duration_minutes', e.target.value)}
                            />
                            <InputError message={form.errors.duration_minutes} className="mt-1" />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                />
                                <span className="text-xs font-bold text-slate-700">Active & Published</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <InputLabel value="Description" />
                        <TextArea
                            className="mt-1"
                            rows={3}
                            value={form.data.description ?? ''}
                            onChange={(e) => form.setData('description', e.target.value)}
                        />
                        <InputError message={form.errors.description} className="mt-1" />
                    </div>

                    {/* Danger Zone: Delete Package */}
                    {onDelete && (
                        <div className="pt-4 border-t border-slate-100">
                            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                        <AlertTriangle size={14} className="text-rose-500" />
                                        Hapus Paket Ujian
                                    </p>
                                    <p className="text-[11px] text-rose-600/80 mt-0.5 font-medium">
                                        {hasSessions
                                            ? 'Paket tidak dapat dihapus karena sudah memiliki sesi peserta.'
                                            : 'Tindakan ini permanen dan akan menghapus seluruh soal terkait.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={hasSessions}
                                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
                                        hasSessions
                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                            : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white shadow-xs cursor-pointer'
                                    }`}
                                >
                                    <Trash2 size={13} />
                                    <span>Hapus</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <SecondaryButton type="button" onClick={onClose}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={form.processing} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
