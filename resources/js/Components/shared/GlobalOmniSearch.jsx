import React, { useState, useEffect, useRef, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Search, Compass, User, UserCheck, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLeadDrawer } from '@/Contexts/LeadDrawerContext';

export default function GlobalOmniSearch({ availableMenus = [] }) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [leadResults, setLeadResults] = useState([]);
    const [isLoadingLeads, setIsLoadingLeads] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const { openDrawer } = useLeadDrawer();

    // Flatten accessible menus for instant client-side lookup
    const allMenuItems = useMemo(() => {
        const list = [];
        availableMenus.forEach((group) => {
            if (group.items) {
                group.items.forEach((item) => {
                    list.push({
                        category: group.category || 'Menu',
                        title: item.text,
                        href: item.href,
                        icon: item.icon,
                    });
                });
            }
        });
        return list;
    }, [availableMenus]);

    // 1. Filter Menu instantly on Client-Side (Zero Server Load)
    const matchingMenus = useMemo(() => {
        if (!query.trim()) return [];
        const cleanQuery = query.toLowerCase().trim();
        return allMenuItems.filter((m) =>
            m.title.toLowerCase().includes(cleanQuery) ||
            m.category.toLowerCase().includes(cleanQuery)
        ).slice(0, 5);
    }, [query, allMenuItems]);

    // Combined items for keyboard navigation (↑, ↓, Enter)
    const combinedItems = useMemo(() => {
        const items = [];
        matchingMenus.forEach((m) => {
            items.push({ type: 'menu', data: m });
        });
        leadResults.forEach((l) => {
            items.push({ type: l.type === 'registration' ? 'registration' : 'lead', data: l });
        });
        return items;
    }, [matchingMenus, leadResults]);

    // Global keyboard shortcut Ctrl + K or Cmd + K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
            } else if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle Click Outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 2. Debounced Server-Side Search for Leads (Min 2 chars, debounced 300ms, cancellable)
    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setLeadResults([]);
            setIsLoadingLeads(false);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            return;
        }

        setIsLoadingLeads(true);

        const debounceTimer = setTimeout(() => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            axios.get(route('admin.crm.leads.quick-search'), {
                params: { q: trimmed },
                signal: abortControllerRef.current.signal,
            })
            .then((res) => {
                setLeadResults(Array.isArray(res.data) ? res.data : []);
            })
            .catch((err) => {
                if (!axios.isCancel(err)) {
                    console.error('OmniSearch Error:', err);
                }
            })
            .finally(() => {
                setIsLoadingLeads(false);
            });
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    // Reset selected index when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, leadResults.length]);

    const handleSelect = (item) => {
        if (!item) return;

        setIsOpen(false);
        setQuery('');

        if (item.type === 'menu') {
            if (item.data.href) {
                router.visit(item.data.href);
            }
        } else if (item.type === 'lead') {
            openDrawer(item.data.id, 0);
        } else if (item.type === 'registration') {
            router.visit(route('admin.crm.registrations.index', { preview_reg: item.data.id }));
        }
    };

    // Keyboard navigation
    const handleInputKeyDown = (e) => {
        if (!isOpen) {
            setIsOpen(true);
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % (combinedItems.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % (combinedItems.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (combinedItems[selectedIndex]) {
                handleSelect(combinedItems[selectedIndex]);
            }
        }
    };

    return (
        <div className="relative w-full max-w-lg" ref={containerRef}>
            {/* Search Input Bar */}
            <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className={`w-4 h-4 transition-colors ${isOpen ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Search menu or lead (name / phone)..."
                    className="w-full pl-10 pr-20 py-2 bg-gray-50/80 hover:bg-gray-100/80 focus:bg-white text-sm text-gray-900 placeholder-gray-400 rounded-xl border border-gray-200/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                />

                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5 pointer-events-none">
                    {isLoadingLeads ? (
                        <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                    ) : (
                        <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 rounded-md shadow-2xs">
                            <span className="text-[11px]">⌘</span>K
                        </div>
                    )}
                </div>
            </div>

            {/* Omni-Search Dropdown Result Modal */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header Hints */}
                    <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-end text-[11px] font-medium text-gray-400">
                        <span className="flex items-center gap-2">
                            <span>Use <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">↓</kbd> to navigate</span>
                            <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">ESC</kbd> to close</span>
                        </span>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 p-1.5">
                        {/* 1. Menus Section */}
                        {matchingMenus.length > 0 && (
                            <div className="p-1">
                                <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5 text-primary-500" />
                                    <span>Navigation Menus</span>
                                </div>
                                <div className="space-y-0.5">
                                    {matchingMenus.map((menu, mIdx) => {
                                        const globalIndex = mIdx;
                                        const isSelected = selectedIndex === globalIndex;
                                        return (
                                            <button
                                                key={`menu-${mIdx}`}
                                                type="button"
                                                onClick={() => handleSelect({ type: 'menu', data: menu })}
                                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl transition-all ${
                                                    isSelected ? 'bg-red-50 text-red-950 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {menu.icon || <Compass size={14} />}
                                                    </span>
                                                    <div className="truncate">
                                                        <div className="text-sm">{menu.title}</div>
                                                        <div className="text-[11px] text-gray-400 font-normal">{menu.category}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <span>Open</span>
                                                    <ArrowRight size={13} className="text-gray-400" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2. Leads & Registrations Section */}
                        {leadResults.length > 0 && (
                            <div className="p-1">
                                <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-gray-400 uppercase flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-blue-500" />
                                    <span>Leads & Registrations</span>
                                </div>
                                <div className="space-y-0.5">
                                    {leadResults.map((lead, lIdx) => {
                                        const globalIndex = matchingMenus.length + lIdx;
                                        const isSelected = selectedIndex === globalIndex;
                                        const isReg = lead.type === 'registration';

                                        return (
                                            <button
                                                key={`lead-${lead.id}-${lIdx}`}
                                                type="button"
                                                onClick={() => handleSelect({ type: isReg ? 'registration' : 'lead', data: lead })}
                                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-xl transition-all ${
                                                    isSelected ? 'bg-red-50 text-red-950 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className={`p-1.5 rounded-lg ${
                                                        isReg 
                                                            ? 'bg-amber-100 text-amber-700' 
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {isReg ? <UserCheck size={14} /> : <User size={14} />}
                                                    </span>
                                                    <div className="truncate">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm truncate">{lead.name}</span>
                                                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                                                isReg 
                                                                    ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                                                                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                                                            }`}>
                                                                {isReg ? 'Inbox' : 'Lead'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 font-normal flex items-center gap-2">
                                                            <span>{lead.phone || 'No phone'}</span>
                                                            {lead.lead_number && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{lead.lead_number}</span>
                                                                </>
                                                            )}
                                                            {lead.branch_name && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-red-500 font-medium">{lead.branch_name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <span className="text-[11px]">{isReg ? 'Review' : 'View Profile'}</span>
                                                    <CornerDownLeft size={13} />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Empty States */}
                        {!query.trim() && (
                            <div className="py-8 px-4 text-center">
                                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-gray-600">Quick Navigation & Search</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Type a menu name (e.g. <span className="font-semibold text-gray-600">"kanban"</span>, <span className="font-semibold text-gray-600">"billing"</span>) or a lead name/phone.
                                </p>
                            </div>
                        )}

                        {query.trim().length > 0 && matchingMenus.length === 0 && leadResults.length === 0 && !isLoadingLeads && (
                            <div className="py-8 px-4 text-center">
                                <p className="text-xs font-semibold text-gray-600">No results found for "{query}"</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Try searching by full menu title, student name, or phone number.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
