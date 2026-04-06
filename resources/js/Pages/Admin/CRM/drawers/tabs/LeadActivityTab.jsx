import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EmptyState } from '../components/DrawerUI';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { formatIsoDateOrFallback } from '@/Utils/dateFormatter';

export default function LeadActivityTab({ leadId }) {
    const [activities, setActivities] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observer = useRef();

    useEffect(() => {
        if (leadId) {
            setActivities([]);
            setPage(1);
            setHasMore(true);
            fetchActivities(1, true);
        }
    }, [leadId]);

    const fetchActivities = async (pageNumber, isInitial = false) => {
        if (!leadId) return;
        
        setLoading(true);
        try {
            const response = await axios.get(route('admin.crm.leads.activities', leadId), {
                params: { page: pageNumber }
            });
            
            const newActivities = response.data.activities;
            const pagination = response.data.pagination;

            setActivities(prev => isInitial ? newActivities : [...prev, ...newActivities]);
            setHasMore(pagination.has_more);
        } catch (error) {
            console.error('Failed to fetch lead activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const lastElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const nextPage = prevPage + 1;
                    fetchActivities(nextPage);
                    return nextPage;
                });
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    return (
        <div className="relative pl-8 border-l-2 border-slate-100 space-y-12 ml-4 outline-none pb-10">
            {(!loading && activities.length === 0) ? (
                <EmptyState title="No recent activity" desc="History logs will appear here as interactions occur." />
            ) : (
                activities.map((activity, index) => {
                    const isLastElement = activities.length === index + 1;
                    return (
                        <div 
                            key={activity.id} 
                            className="relative" 
                            ref={isLastElement ? lastElementRef : null}
                        >
                            <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-2 border-red-500 shadow-sm" />
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded">
                                        {activity.human_at}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">
                                        by <span className="text-slate-900 font-bold">{activity.causer?.name || 'System'}</span>
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                    {activity.description}
                                </p>
                                {activity.changes && activity.changes.length > 0 && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl space-y-3">
                                        {activity.changes.map((change, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 text-[11px]">
                                                <span className="font-bold text-slate-500 min-w-[100px]">
                                                    {change.field}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-400 line-through truncate max-w-[150px]" title={change.old}>
                                                        {formatIsoDateOrFallback(change.old)}
                                                    </span>
                                                    <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 font-bold truncate max-w-[150px]" title={change.new}>
                                                        {formatIsoDateOrFallback(change.new)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
            
            {loading && (
                <div className="relative pt-6 flex justify-center">
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
            )}
        </div>
    );
}
