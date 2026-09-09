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
            full: "sm:max-w-[96vw] max-w-[96vw]",
            screen: "w-screen h-screen max-w-none m-0 rounded-none sm:my-0 sm:max-w-none",
        }[maxWidth] || "sm:max-w-lg";

    const isScreen = maxWidth === "screen";

    return createPortal(
        <div
            className={`fixed inset-0 z-[10000] overflow-y-auto ${isScreen ? "p-0" : ""}`}
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
            <div className={`flex min-h-full justify-center text-center ${isScreen ? "items-center p-0" : "items-end p-4 sm:items-center sm:p-0"}`}>
                <div
                    className={`relative transform overflow-hidden bg-white text-left shadow-2xl transition-all ${
                        isScreen ? "w-screen h-screen m-0 rounded-none max-w-none ring-0 flex flex-col" : `rounded-xl ring-1 ring-gray-900/5 sm:my-8 sm:w-full ${maxWidthClass}`
                    }`}
                >
                    {/* Header */}
                    {title && (
                        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:px-6 shrink-0">
                            <h3
                                className="text-base font-semibold leading-6 text-gray-900"
                                id="modal-title"
                            >
                                {title}
                            </h3>
                        </div>
                    )}
                    {/* Body */}
                    <div className={isScreen ? "flex-1 flex flex-col min-h-0 p-0 overflow-hidden" : "px-4 py-5 sm:p-6"}>{children}</div>
                </div>
            </div>
        </div>,
        document.body
    );
}
