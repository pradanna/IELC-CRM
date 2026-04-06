import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({
    show,
    onClose,
    title,
    maxWidth = "lg",
    children,
}) {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [show]);

    if (!show) return null;

    const maxWidthClass =
        {
            sm: "sm:max-w-sm",
            md: "sm:max-w-md",
            lg: "sm:max-w-lg",
            xl: "sm:max-w-xl",
            "2xl": "sm:max-w-2xl",
            "3xl": "sm:max-w-3xl",
            "4xl": "sm:max-w-4xl",
            "5xl": "sm:max-w-5xl",
            "6xl": "sm:max-w-6xl",
            "7xl": "sm:max-w-7xl",
        }[maxWidth] || "sm:max-w-lg";

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal Panel */}
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div
                    className={`relative transform overflow-visible rounded-xl bg-white text-left shadow-2xl ring-1 ring-gray-900/5 transition-all sm:my-8 sm:w-full ${maxWidthClass}`}
                >
                    {/* Header */}
                    {title && (
                        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:px-6">
                            <h3
                                className="text-base font-semibold leading-6 text-gray-900"
                                id="modal-title"
                            >
                                {title}
                            </h3>
                        </div>
                    )}
                    {/* Body */}
                    <div className="px-4 py-5 sm:p-6">{children}</div>
                </div>
            </div>
        </div>,
        document.body
    );
}
