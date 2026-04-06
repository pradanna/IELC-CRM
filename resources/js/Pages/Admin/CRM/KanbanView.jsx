import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CrmLayout from './partials/CrmLayout';
import FiltersBar from './partials/FiltersBar';
import LeadDetailDrawer from './drawers/LeadDetailDrawer';
import CreateEditLeadModal from './modals/CreateEditLeadModal';
import { DndContext, DragOverlay, rectIntersection, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Import New Architecture
import useKanbanBoard from './hooks/useKanbanBoard';
import KanbanColumn from './partials/KanbanColumn';
import KanbanCard from './partials/KanbanCard';

export default function KanbanView({ auth, kanbanData, filters, branches, phases, sources, types, chatTemplates, mediaAssets }) {
    const {
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
        sensors,
        openLeadDetail,
        handleDragStart,
        handleDragOver,
        handleDragEnd
    } = useKanbanBoard(kanbanData);

    const scrollContainerRef = React.useRef(null);

    const scrollBoard = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 344; // Approx width of one column (w-80 = 320px + gap-6 = 24px)
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="CRM Board" />

            {/* Custom styled scrollbar for Kanban - Mac Style */}
            <style dangerouslySetInnerHTML={{__html: `
                .scrollbar-kanban::-webkit-scrollbar {
                    height: 10px;
                }
                .scrollbar-kanban::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-kanban::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                    border: 2px solid #f8fafc; /* Adds padding feel */
                }
                .scrollbar-kanban::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
            `}} />
            
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                <CrmLayout 
                    onNewLead={() => {
                        setEditingLead(null);
                        setIsLeadModalOpen(true);
                    }}
                    onSelectLead={(id) => openLeadDetail(id, 0)}
                >
                    <div className="space-y-10">
                        {/* Filters Section */}
                        <FiltersBar 
                            filters={filters} 
                            branches={branches} 
                            phases={phases}
                            targetRoute="admin.crm.leads.kanban" 
                        />

                        {/* Kanban Board Area */}
                        <div className="relative group/board">
                            {/* Floating Nav Buttons */}
                            <button 
                                onClick={() => scrollBoard('left')}
                                className="absolute left-[-20px] top-1/3 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 hover:scale-110 hover:shadow-xl transition-all z-10 opacity-0 group-hover/board:opacity-100"
                            >
                                <ChevronLeft size={24} strokeWidth={2.5} className="mr-0.5" />
                            </button>
                            <button 
                                onClick={() => scrollBoard('right')}
                                className="absolute right-[-20px] top-1/3 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur shadow-lg border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-red-600 hover:scale-110 hover:shadow-xl transition-all z-10 opacity-0 group-hover/board:opacity-100"
                            >
                                <ChevronRight size={24} strokeWidth={2.5} className="ml-0.5" />
                            </button>

                            {/* Hint tip for power users */}
                            <div className="absolute -top-7 right-2 text-xs font-medium text-slate-400 opacity-0 group-hover/board:opacity-100 transition-opacity flex items-center gap-1.5">
                                💡 Tip: Tekan tombol <b>Shift + Scroll</b> untuk menggeser papan
                            </div>

                            <div 
                                ref={scrollContainerRef}
                                className="overflow-auto scrollbar-kanban h-[calc(100vh-320px)]"
                            >
                                <div className="flex items-stretch gap-6 min-h-full pb-8 pr-8 w-max">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={rectIntersection}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragEnd={handleDragEnd}
                                >
                                    {boardData.map((phase) => (
                                        <KanbanColumn 
                                            key={phase.id} 
                                            phase={phase} 
                                            leads={phase.leads} 
                                            onCardClick={openLeadDetail}
                                        />
                                    ))}

                                    <DragOverlay dropAnimation={{
                                        sideEffects: defaultDropAnimationSideEffects({
                                            styles: {
                                                active: {
                                                    opacity: '0.4',
                                                },
                                            },
                                        }),
                                    }}>
                                        {activeLead ? (
                                            <KanbanCard lead={activeLead} isOverlay={true} />
                                        ) : null}
                                    </DragOverlay>
                                </DndContext>
                                </div>
                            </div>
                        </div>
                    </div>
                </CrmLayout>
            </div>

            {/* Drawer & Modals */}
            <CreateEditLeadModal 
                isOpen={isLeadModalOpen} 
                onClose={() => {
                    setIsLeadModalOpen(false);
                    setEditingLead(null);
                }}
                onSaveSuccess={(newLeadId) => {
                    if (newLeadId) openLeadDetail(newLeadId, 0);
                }}
                lead={editingLead}
                branches={branches}
                sources={sources}
                types={types}
            />

            <LeadDetailDrawer 
                leadId={selectedLeadId}
                isOpen={isDetailDrawerOpen}
                initialTabIndex={drawerTabIndex}
                onClose={() => setIsDetailDrawerOpen(false)}
                onEditLead={(lead) => {
                    setEditingLead(lead);
                    setIsLeadModalOpen(true);
                }}
                onOpenWhatsapp={(lead) => openLeadDetail(lead.id, 2)}
                chatTemplates={chatTemplates}
                mediaAssets={mediaAssets}
                phases={phases}
            />
        </AuthenticatedLayout>
    );
}
