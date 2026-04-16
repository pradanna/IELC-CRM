import React from 'react';
import { Filter, MapPin, Calendar } from 'lucide-react';
import { router } from '@inertiajs/react';
import useMonthYear from '@/Hooks/useMonthYear';
import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect';

export default function DashboardFilters({ 
    filters = {}, 
    branches = [], 
    targetRoute = 'admin.crm.leads.index' 
}) {
    const { months, years } = useMonthYear();
    
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

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 relative z-20">
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                <Filter size={14} className="text-red-500" />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Dashboard Filters</span>
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

            <button 
                onClick={clearFilters}
                className="ml-auto text-sm font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
                Clear All
            </button>
        </div>
    );
}
