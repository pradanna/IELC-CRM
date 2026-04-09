import { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import axios from 'axios';
import { 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors 
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export default function useKanbanBoard(kanbanData) {
    const [boardData, setBoardData] = useState(kanbanData);
    const [activeLead, setActiveLead] = useState(null);
    
    // Drawer/Modal States
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [drawerTabIndex, setDrawerTabIndex] = useState(0);
    const [drawerRefreshTrigger, setDrawerRefreshTrigger] = useState(0);

    // Sync state with props
    useEffect(() => {
        setBoardData(kanbanData);
    }, [kanbanData]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Requires 8px drag before taking over, allows onClick to work
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const openLeadDetail = (id, tabIndex = 0) => {
        setDrawerTabIndex(tabIndex);
        setSelectedLeadId(id);
        setIsDetailDrawerOpen(true);
        setDrawerRefreshTrigger(0);
    };

    const findContainer = (id) => {
        if (boardData.some(p => p.id === id)) return id;
        const phase = boardData.find(p => (p.leads.data || p.leads).some(l => l.id === id));
        return phase ? phase.id : null;
    };

    const findLead = (id) => {
        for (const phase of boardData) {
            const items = phase.leads.data || phase.leads;
            const lead = items.find(l => l.id === id);
            if (lead) return lead;
        }
        return null;
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const lead = findLead(active.id);
        if (lead) setActiveLead(lead);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        setBoardData((prev) => {
            const activePhase = prev.find(p => p.id === activeContainer);
            const overPhase = prev.find(p => p.id === overContainer);
            
            const activeItems = (activePhase.leads.data || activePhase.leads) || [];
            const overItems = (overPhase.leads.data || overPhase.leads) || [];

            const activeIndex = activeItems.findIndex(i => i.id === activeId);
            const overIndex = over.data?.current?.type === 'Column' 
                ? overItems.length 
                : overItems.findIndex(i => i.id === overId);

            const itemToMove = activeItems[activeIndex];

            return prev.map(phase => {
                if (phase.id === activeContainer) {
                    const newLeads = activeItems.filter(i => i.id !== activeId);
                    return { ...phase, leads: activePhase.leads.data ? { ...activePhase.leads, data: newLeads } : newLeads };
                }
                if (phase.id === overContainer) {
                    const newLeads = [...overItems];
                    newLeads.splice(overIndex, 0, itemToMove);
                    return { ...phase, leads: overPhase.leads.data ? { ...overPhase.leads, data: newLeads } : newLeads };
                }
                return phase;
            });
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveLead(null);
        
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        // If dropped in a different container (compared to its original DB phase), update DB
        if (activeLead && activeLead.lead_phase_id !== overContainer) {
            try {
                await axios.patch(route('admin.crm.leads.update-phase', activeId), {
                    lead_phase_id: overContainer
                });
                
                // Update activeLead phase locally to prevent repeat issues
                setActiveLead(prev => prev ? { ...prev, lead_phase_id: overContainer } : null);
            } catch (error) {
                console.error("Failed to update lead phase:", error);
            }
        }

        // Visual reshuffling inside the same container
        if (activeContainer === overContainer && activeId !== overId) {
            setBoardData((prev) => {
                const phase = prev.find(p => p.id === activeContainer);
                const items = phase.leads.data || phase.leads;
                const oldIndex = items.findIndex(i => i.id === activeId);
                const newIndex = items.findIndex(i => i.id === overId);

                const newItems = arrayMove(items, oldIndex, newIndex);

                return prev.map(p => {
                    if (p.id === activeContainer) {
                        return { ...p, leads: phase.leads.data ? { ...phase.leads, data: newItems } : newItems };
                    }
                    return p;
                });
            });
        }
    };

    return {
        boardData,
        activeLead,
        isLeadModalOpen,
        setIsLeadModalOpen,
        editingLead,
        setEditingLead,
        isDetailDrawerOpen,
        setIsDetailDrawerOpen,
        selectedLeadId,
        drawerTabIndex,
        drawerRefreshTrigger,
        setDrawerRefreshTrigger,
        sensors,
        openLeadDetail,
        handleDragStart,
        handleDragOver,
        handleDragEnd
    };
}
