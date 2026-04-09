import React, { createContext, useContext, useState, useCallback } from 'react';

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
    const [isOpen, setIsOpen] = useState(false);
    const [leadId, setLeadId] = useState(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const openDrawer = useCallback((id, tab = 0) => {
        setLeadId(id);
        setTabIndex(tab);
        setIsOpen(true);
        // Reset or increment refresh trigger if needed so it refetches cleanly
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsOpen(false);
        // We do not unset leadId so the closing animation is smooth
    }, []);

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
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
