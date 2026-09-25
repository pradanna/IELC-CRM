import React, { Fragment } from 'react';
import {
    Dialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
    zIndex = 'z-50',
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '4xl': 'sm:max-w-4xl',
        '6xl': 'sm:max-w-6xl',
        '7xl': 'sm:max-w-7xl',
        full: 'sm:max-w-[98vw]',
        screen: 'w-screen h-screen max-w-none m-0 rounded-none',
    }[maxWidth] || 'sm:max-w-2xl';

    const isScreen = maxWidth === 'screen';

    return (
        <Transition show={show} as={Fragment} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className={`relative ${zIndex}`}
                onClose={close}
            >
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className={`flex min-h-full items-center justify-center ${
                        isScreen ? 'p-0' : 'p-4 text-center sm:p-0'
                    }`}>
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <DialogPanel
                                className={`relative transform overflow-hidden bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full ${
                                    isScreen ? 'w-screen h-screen m-0 rounded-none max-w-none mb-0' : `rounded-2xl ${maxWidthClass}`
                                }`}
                            >
                                {children}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
