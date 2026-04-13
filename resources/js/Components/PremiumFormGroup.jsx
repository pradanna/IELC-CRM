import React from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function PremiumFormGroup({ 
    label, 
    error, 
    children, 
    required = false, 
    className = '',
    labelClassName = '',
    contentClassName = ''
}) {
    // Clone child to inject error styling if it's a standard input-like component
    const enhancedChildren = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, {
                className: `${child.props.className || ''} ${error ? 'border-red-500 ring-red-500/10 focus:ring-red-500/10' : ''}`
            });
        }
        return child;
    });

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <div className="flex items-center justify-between ml-1">
                    <InputLabel 
                        value={label} 
                        className={`text-[10px] font-black uppercase tracking-widest text-slate-400 ${labelClassName}`} 
                    />
                    {required && <span className="text-red-500 text-[10px] font-black -mt-0.5">*</span>}
                </div>
            )}
            
            <div className={contentClassName}>
                {enhancedChildren}
            </div>

            <InputError message={error} />
        </div>
    );
}
