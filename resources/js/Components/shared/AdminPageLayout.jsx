import React from 'react';
import { Head } from '@inertiajs/react';

/**
 * AdminPageLayout
 * A standard layout component for admin pages in IELC-CRM.
 * 
 * @param {string} title - The main page title
 * @param {string} subtitle - Secondary text under the title
 * @param {React.ReactNode} actions - Buttons or elements to display on the right
 * @param {React.ReactNode} children - Main content
 * @param {string} maxWidth - Optional max-width class (default: max-w-[1600px])
 * @param {React.ReactNode} backLink - Optional back button element
 */
export default function AdminPageLayout({ 
    title, 
    subtitle, 
    actions, 
    children, 
    maxWidth = "max-w-[1600px]",
    backLink = null
}) {
    return (
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-700`}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    {backLink}
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none capitalize">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-slate-500 font-bold text-sm mt-1 ">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="space-y-12">
                {children}
            </div>
        </div>
    );
}
