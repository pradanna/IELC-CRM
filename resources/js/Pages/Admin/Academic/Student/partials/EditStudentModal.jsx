import React, { useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { Save, X, UserCheck, ShieldAlert, Calendar, Loader2 } from 'lucide-react';
import Button from '@/Components/ui/Button';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/form/InputLabel';
import InputError from '@/Components/form/InputError';
import TextArea from '@/Components/ui/TextArea';

export default function EditStudentModal({ show, onClose, student, defaultStatus = null }) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        status: 'active',
        start_join: '',
        notes: '',
    });

    useEffect(() => {
        if (show && student) {
            setData({
                status: defaultStatus || student.status || 'active',
                start_join: student.start_join || '',
                notes: student.notes || '',
            });
            clearErrors();
        }
    }, [show, student, defaultStatus]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.academic.students.update', student.id), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Transition show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-55 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[32px] bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-100">
                                {/* Header */}
                                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                                    <div className="space-y-1">
                                        <Dialog.Title className="text-xl font-black text-slate-900 tracking-tight uppercase">
                                            Edit Student Status
                                        </Dialog.Title>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {student.student_number} • {student.lead?.name}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={onClose}
                                        className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                    {/* Status Selection */}
                                    <div className="space-y-2">
                                        <InputLabel htmlFor="status" value="Student Status" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setData('status', 'active')}
                                                className={`py-4 px-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-black text-xs uppercase tracking-wider ${
                                                    data.status === 'active'
                                                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
                                                        : 'border-slate-200 text-slate-400 hover:border-slate-350 hover:bg-slate-50'
                                                }`}
                                            >
                                                <UserCheck className="w-5 h-5" />
                                                Active
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('status', 'stop')}
                                                className={`py-4 px-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-black text-xs uppercase tracking-wider ${
                                                    data.status === 'stop'
                                                        ? 'border-rose-500 bg-rose-50/50 text-rose-700'
                                                        : 'border-slate-200 text-slate-400 hover:border-slate-350 hover:bg-slate-50'
                                                }`}
                                            >
                                                <ShieldAlert className="w-5 h-5" />
                                                Stopped
                                            </button>
                                        </div>
                                        <InputError message={errors.status} />
                                    </div>

                                    {/* Start Join Date */}
                                    <div className="space-y-2">
                                        <InputLabel htmlFor="start_join" value="Start Join Date" />
                                        <div className="relative">
                                            <TextInput 
                                                id="start_join"
                                                type="date"
                                                value={data.start_join}
                                                onChange={(e) => setData('start_join', e.target.value)}
                                                className="w-full !pl-11 border-slate-200 focus:border-red-500 transition-all font-bold text-sm rounded-xl py-3"
                                            />
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        </div>
                                        <InputError message={errors.start_join} />
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <InputLabel htmlFor="notes" value="Notes / Remarks" />
                                        <TextArea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Write remarks or reasons for student stop..."
                                            className="w-full min-h-[100px]"
                                        />
                                        <InputError message={errors.notes} />
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-50">
                                        <Button
                                            type="button"
                                            onClick={onClose}
                                            variant="ghost"
                                            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={processing}
                                            icon={processing ? Loader2 : Save}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-750 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all"
                                        >
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
