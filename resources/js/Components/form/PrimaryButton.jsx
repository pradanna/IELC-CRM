import { Loader2 } from 'lucide-react';

export default function PrimaryButton({
    className = "",
    disabled,
    processing,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:bg-gray-900 ${
                    disabled && "opacity-25"
                } ` + className
            }
            disabled={disabled || processing}
        >
            {processing && <Loader2 size={14} className="mr-2 animate-spin" />}
            {children}
        </button>
    );
}
