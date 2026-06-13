import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';

const LeadDrawerContext = createContext({
    isOpen: false,
    leadId: null,
    tabIndex: 0,
    refreshTrigger: 0,
    openDrawer: () => {},
    closeDrawer: () => {},
    triggerRefresh: () => {}
});

export const useLeadDrawer = () => useContext(LeadDrawerContext);

export function LeadDrawerProvider({ children }) {
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('active_lead_drawer_id') ? true : false;
        }
        return false;
    });
    const [leadId, setLeadId] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('active_lead_drawer_id') || null;
        }
        return null;
    });
    const [tabIndex, setTabIndex] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('active_lead_drawer_tab');
            return saved ? parseInt(saved) : 0;
        }
        return 0;
    });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const openDrawer = useCallback((id, tab = 0) => {
        setLeadId(id);
        setTabIndex(tab);
        setIsOpen(true);
        setRefreshTrigger(prev => prev + 1);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('active_lead_drawer_id', id.toString());
            sessionStorage.setItem('active_lead_drawer_tab', tab.toString());
        }
    }, []);

    const closeDrawer = useCallback(() => {
        setIsOpen(false);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('active_lead_drawer_id');
            sessionStorage.removeItem('active_lead_drawer_tab');
        }
    }, []);

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const unregister = router.on('navigate', (event) => {
            const newPath = event.detail.page.url;
            const isCrmPath = newPath.includes('/admin/crm');
            if (!isCrmPath) {
                setIsOpen(false);
                sessionStorage.removeItem('active_lead_drawer_id');
                sessionStorage.removeItem('active_lead_drawer_tab');
            }
        });

        return () => unregister();
    }, []);

    return (
        <LeadDrawerContext.Provider
            value={{
                isOpen,
                leadId,
                tabIndex,
                refreshTrigger,
                openDrawer,
                closeDrawer,
                triggerRefresh
            }}
        >
            {children}
        </LeadDrawerContext.Provider>
    );
}
