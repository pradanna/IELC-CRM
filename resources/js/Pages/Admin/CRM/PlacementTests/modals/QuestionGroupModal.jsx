import Modal from '@/Components/ui/Modal';
import TextInput from '@/Components/form/TextInput';
import TextArea from '@/Components/ui/TextArea';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import PrimaryButton from '@/Components/form/PrimaryButton';
import SecondaryButton from '@/Components/form/SecondaryButton';

export default function QuestionGroupModal({ show, onClose, form, onSubmit, editingGroup }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="4xl">
            <div className="p-8">
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                    {editingGroup ? 'Edit Question Group' : 'New Question Group'}
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                    Group questions under a shared context (Reading / Listening)
                </p>

                <form onSubmit={onSubmit} className="space-y-5">
                    {/* Instruction */}
                    <div>
                        <InputLabel value="Primary Instruction" />
                        <TextInput
                            required
                            className="mt-1"
                            value={form.data.instruction}
                            onChange={(e) => form.setData('instruction', e.target.value)}
                            placeholder="e.g., Read the following text and answer questions 1-5"
                        />
                        <InputError message={form.errors.instruction} className="mt-1" />
                    </div>

                    {/* Reading Text */}
                    <div>
                        <InputLabel value="Context / Reading Material" />
                        <TextArea
                            className="mt-1"
                            rows={8}
                            value={form.data.reading_text ?? ''}
                            onChange={(e) => form.setData('reading_text', e.target.value)}
                            placeholder="Enter reading passage or text context here..."
                        />
                        <InputError message={form.errors.reading_text} className="mt-1" />
                    </div>

                    {/* Audio */}
                    <div>
                        <InputLabel value="Group Audio (Listening)" />
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => form.setData('media', e.target.files[0])}
                            className="mt-1 block w-full text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200 p-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <SecondaryButton type="button" onClick={onClose}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={form.processing} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                            {form.processing ? 'Saving...' : editingGroup ? 'Update Group' : 'Save Group'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
