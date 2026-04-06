import { usePage } from "@inertiajs/react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function Toast() {
    const { flash, errors } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState("success");

    useEffect(() => {
        if (flash?.success) {
            setMessage(flash.success);
            setType("success");
            setVisible(true);
        } else if (flash?.error) {
            setMessage(flash.error);
            setType("error");
            setVisible(true);
        } else if (errors && Object.keys(errors).length > 0) {
            setMessage("Silakan periksa kembali inputan form Anda.");
            setType("error");
            setVisible(true);
        }

        if (
            flash?.success ||
            flash?.error ||
            (errors && Object.keys(errors).length > 0)
        ) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 3000); // Otomatis hilang setelah 3 detik
            return () => clearTimeout(timer);
        }
    }, [flash, errors]);

    if (!visible) return null;

    return (
        <div className="fixed top-5 right-5 z-[999] flex min-w-[300px] animate-in fade-in slide-in-from-top-4 items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-lg ring-1 ring-gray-900/5 transition-all duration-300">
            {type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <p className="flex-1 text-sm font-medium text-gray-900">
                {message}
            </p>
            <button
                onClick={() => setVisible(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
