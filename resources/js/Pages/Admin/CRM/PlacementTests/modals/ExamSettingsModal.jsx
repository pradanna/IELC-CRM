import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import TextArea from '@/Components/ui/TextArea';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';
import Checkbox from '@/Components/form/Checkbox';

export default function ExamSettingsModal({ show, onClose, form, onSubmit }) {
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
