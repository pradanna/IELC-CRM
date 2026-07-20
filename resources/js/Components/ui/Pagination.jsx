import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {

    return (
        <div className="flex flex-wrap items-center gap-1">
            {links.map((link, key) => {
                if (link.url === null) {
                    return (
                        <div
                            key={key}
                            className="px-3 py-1.5 text-xs text-gray-400 border border-gray-100 rounded-lg cursor-default bg-gray-50/50"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={key}
                        href={link.url}
                        className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-all ${
                            link.active
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        preserveScroll
                        preserveState
                    />
                );
            })}
        </div>
    );
}
