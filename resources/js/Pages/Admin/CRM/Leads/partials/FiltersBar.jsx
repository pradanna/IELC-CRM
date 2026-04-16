import React, { useState, useEffect } from 'react';
import { Filter, Calendar, MapPin, ChevronDown, Search } from 'lucide-react';
import { router } from '@inertiajs/react';
import useDebounce from '@/Hooks/useDebounce';
import useMonthYear from '@/Hooks/useMonthYear';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';
import DatePicker from '@/Components/form/DatePicker';

export default function FiltersBar({ 
    filters = {}, 
    branches = [], 
    phases = [], 
    targetRoute = 'admin.crm.leads.index'
}) {
    // const { months, years } = useMonthYear(); // No longer needed
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Sync local search term with filter props (useful for "Clear All" or browser back/forward)
    useEffect(() => {
        setSearchTerm(filters.search || '');
    }, [filters.search]);

    const handleFilterChange = (key, value) => {
        let newFilters = { ...filters, [key]: value };
        
        // UX Enhancement: Auto-sync end_date when start_date changes
        if (key === 'start_date' && value) {
            if (!filters.end_date || filters.end_date < value) {
                newFilters.end_date = value;
            }
        }

        // UX Enhancement: Auto-sync start_date if end_date is set to before it
        if (key === 'end_date' && value) {
            if (filters.start_date && value < filters.start_date) {
                newFilters.start_date = value;
            }
        }

        // Clean filters: remove null, undefined, or empty strings
        const cleanedFilters = Object.keys(newFilters).reduce((acc, k) => {
            if (newFilters[k] !== null && newFilters[k] !== undefined && newFilters[k] !== '') {
                acc[k] = newFilters[k];
            }
            return acc;
        }, {});

        router.get(route(targetRoute), cleanedFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Trigger filter change when debounced search term changes
    useEffect(() => {
        if (debouncedSearch === (filters.search || '')) return;
        handleFilterChange('search', debouncedSearch);
    }, [debouncedSearch]);

    const clearFilters = () => {
        router.get(route(targetRoute), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * Normalizes a collection that might be a raw array or a wrapped resource object.
     */
    const normalizeCollection = (collection) => {
        if (Array.isArray(collection)) return collection;
        if (collection && Array.isArray(collection.data)) return collection.data;
        return [];
    };

    const normalizedBranches = normalizeCollection(branches);
    const normalizedPhases = normalizeCollection(phases);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 relative z-20">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                <Filter size={14} className="text-red-500" />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filters</span>
            </div>

            {/* Branch Filter */}
            <PremiumSearchableSelect 
                options={normalizedBranches.map(b => ({ value: b.id, label: b.name }))}
                value={filters.branch_id}
                onChange={(val) => handleFilterChange('branch_id', val)}
                placeholder="All Branches"
                icon={MapPin}
                className="w-[200px]"
            />

            {/* Phase Filter */}
            <PremiumSearchableSelect 
                options={normalizedPhases.map(p => ({ value: p.id, label: p.name }))}
                value={filters.lead_phase_id}
                onChange={(val) => handleFilterChange('lead_phase_id', val)}
                placeholder="All Phases"
                className="w-[200px]"
            />

            {/* Start Date Filter */}
            <div className="w-[180px]">
                <DatePicker 
                    value={filters.start_date}
                    onChange={(val) => handleFilterChange('start_date', val)}
                    placeholder="Start Date"
                    className="w-full"
                    inputClassName="!py-3 !px-5 !rounded-2xl !text-[11px] font-black uppercase tracking-wider border-slate-300 shadow-sm"
                />
            </div>
            
            <div className="text-slate-300 font-bold">-</div>

            {/* End Date Filter */}
            <div className="w-[180px]">
                <DatePicker 
                    value={filters.end_date}
                    onChange={(val) => handleFilterChange('end_date', val)}
                    placeholder="End Date"
                    className="w-full"
                    inputClassName="!py-3 !px-5 !rounded-2xl !text-[11px] font-black uppercase tracking-wider border-slate-300 shadow-sm"
                />
            </div>


            <button 
                onClick={clearFilters}
                className="ml-auto text-sm font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
                Clear All
            </button>
        </div>
    );
}
