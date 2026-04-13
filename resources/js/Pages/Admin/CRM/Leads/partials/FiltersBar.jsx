import React, { useState, useEffect } from 'react';
import { Filter, Calendar, MapPin, ChevronDown, Search } from 'lucide-react';
import { router } from '@inertiajs/react';
import useDebounce from '@/Hooks/useDebounce';
import useMonthYear from '@/Hooks/useMonthYear';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';

export default function FiltersBar({ filters = {}, branches = [], phases = [], targetRoute = 'admin.crm.leads.index' }) {
    const { months, years } = useMonthYear();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Sync local search term with filter props (useful for "Clear All" or browser back/forward)
    useEffect(() => {
        setSearchTerm(filters.search || '');
    }, [filters.search]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        
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

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 relative z-20">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                <Filter size={14} className="text-red-500" />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Filters</span>
            </div>

            {/* Branch Filter */}
            <PremiumSearchableSelect 
                options={branches.map(b => ({ value: b.id, label: b.name }))}
                value={filters.branch_id}
                onChange={(val) => handleFilterChange('branch_id', val)}
                placeholder="All Branches"
                icon={MapPin}
                className="w-[200px]"
            />

            {/* Phase Filter */}
            <PremiumSearchableSelect 
                options={(phases || []).map(p => ({ value: p.id, label: p.name }))}
                value={filters.lead_phase_id}
                onChange={(val) => handleFilterChange('lead_phase_id', val)}
                placeholder="All Phases"
                className="w-[200px]"
            />

            {/* Month Filter */}
            <PremiumSearchableSelect 
                options={months}
                value={filters.month}
                onChange={(val) => handleFilterChange('month', val)}
                placeholder="Select Month"
                icon={Calendar}
                className="w-[180px]"
            />

            {/* Year Filter */}
            <PremiumSearchableSelect 
                options={years.map(y => ({ value: y, label: String(y) }))}
                value={filters.year}
                onChange={(val) => handleFilterChange('year', val)}
                placeholder="Select Year"
                className="w-[140px]"
            />

            {/* Search Filter */}
            <div className="relative group flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors pointer-events-none" />
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, phone, or number..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none placeholder:text-gray-400"
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
