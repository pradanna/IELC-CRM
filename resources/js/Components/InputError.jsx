import { AlertCircle } from 'lucide-react';

export default function InputError({ message, className = '', ...props }) {
    if (!message) return null;

    return (
        <div 
            {...props}
            className={'flex items-center gap-1.5 mt-2 px-1 ' + className}
        >
            <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-tight">
                {message}
            </p>
        </div>
    );
}
