import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';

export default function CrmLayout({ children, onNewLead, onSelectLead }) {
    const { url, props } = usePage();
    const pendingCount = props.pending_registrations_count || 0;
    
    const [searchQuery, setSearchQuery] = React.useState('');
    const [results, setResults] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const searchRef = React.useRef(null);

    const tabs = [
        { name: 'Dashboard', href: route('admin.crm.leads.index'), active: route().current('admin.crm.leads.index') },
        { name: 'List View', href: route('admin.crm.leads.list'), active: route().current('admin.crm.leads.list') },
        { name: 'Kanban Board', href: route('admin.crm.leads.kanban'), active: route().current('admin.crm.leads.kanban') },
        { 
            name: 'Registration Inbox', 
            href: route('admin.crm.registrations.index'), 
            active: route().current('admin.crm.registrations.index'),
            badge: pendingCount
        },
    ];

    // Debounced Search Logic
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch();
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle click outside to close dropdown
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(route('admin.crm.leads.quick-search'), {
                params: { q: searchQuery }
            });
            setResults(response.data);
            setShowDropdown(true);
        } catch (error) {
            console.error('Quick search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (leadId) => {
        setSearchQuery('');
        setResults([]);
        setShowDropdown(false);
        if (onSelectLead) onSelectLead(leadId);
    };

    return (
        <div className="space-y-12">
            {/* Header Area (Minimalist) */}
            <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">CRM Workspace</h1>
                        <p className="text-sm font-medium text-gray-400">Manage incoming leads and track conversions.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group w-full md:w-80" ref={searchRef}>
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isLoading ? 'text-red-500 animate-pulse' : 'text-gray-400 group-focus-within:text-red-500'}`} size={18} />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                                placeholder="Quick search (name/pnone)..." 
                                className="pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-4 focus:ring-red-500/5 focus:border-red-500 w-full transition-all"
                            />

                            {/* Results Dropdown */}
                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                    {results.length > 0 ? (
                                        <div className="py-2">
                                            {results.map((lead) => (
                                                <button
                                                    key={lead.id}
                                                    onClick={() => handleSelect(lead.id)}
                                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 border-b border-gray-50 last:border-0"
                                                >
                                                    <span className="text-sm font-black text-gray-900 leading-tight">{lead.name}</span>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        <span>{lead.lead_number}</span>
                                                        <span>•</span>
                                                        <span>{lead.phone}</span>
                                                        <span>•</span>
                                                        <span className="text-red-500">{lead.branch_name}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-slate-50/50">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No results found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={onNewLead}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-red-600/20 transition-all active:scale-95 shrink-0"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">New Lead</span>
                        </button>
                    </div>
                </div>

                {/* Sub Navigation Tabs (Unwrapped) */}
                <div className="mt-8 flex border-b border-gray-200 gap-10">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`pb-4 text-sm font-black tracking-tight transition-all relative flex items-center gap-2 ${
                                tab.active 
                                ? 'text-red-600 border-b-2 border-red-600' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.name}
                            {tab.badge > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-200 animate-in zoom-in duration-300">
                                    {tab.badge}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main CRM Content */}
            <div>{children}</div>
        </div>
    );
}
