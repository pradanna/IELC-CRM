import { usePage } from "@inertiajs/react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

export default function Toast() {
    const { flash, errors } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState("success");
    const [lastMessage, setLastMessage] = useState("");
    const timerRef = useRef(null);

    // Watch for flash/errors and show Toast
    useEffect(() => {
        const currentMessage = flash?.success || flash?.error || (errors && Object.keys(errors).length > 0 ? "Silakan periksa kembali inputan form Anda." : "");
        const currentType = flash?.success ? "success" : "error";

        if (currentMessage && currentMessage !== lastMessage) {
            showToast(currentMessage, currentType);
            setLastMessage(currentMessage);
        }
    }, [flash, errors, lastMessage]);

    // Handle global toast events
    useEffect(() => {
        const handleCustomToast = (e) => {
            const { message, type } = e.detail;
            showToast(message, type);
        };

        window.addEventListener('show-toast', handleCustomToast);
        return () => window.removeEventListener('show-toast', handleCustomToast);
    }, []);

    const showToast = (msg, t = "success") => {
        setMessage(msg);
        setType(t);
        setVisible(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setVisible(false);
        }, 3000);
    };

    if (!visible) return null;

    const content = (
        <div 
            className="fixed top-8 right-8 z-[999999] flex min-w-[320px] max-w-md animate-in fade-in slide-in-from-top-8 items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl ring-1 ring-slate-900/5 transition-all duration-500"
            style={{ pointerEvents: 'auto' }}
        >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                {type === "success" ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
            </div>
            
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 leading-snug">
                    {message}
                </p>
            </div>

            <button
                onClick={() => {
                    setVisible(false);
                }}
                className="group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-600 focus:outline-none"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    );

    return createPortal(content, document.body);
}
