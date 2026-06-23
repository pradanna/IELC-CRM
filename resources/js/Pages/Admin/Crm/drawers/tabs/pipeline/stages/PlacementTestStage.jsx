import React from 'react';
import LeadPlacementTestTab from '../../LeadPlacementTestTab';

export default function PlacementTestStage({ lead, availableExams, onRefresh }) {
    return (
        <LeadPlacementTestTab 
            lead={lead}
            loading={false}
            availableExams={availableExams}
            onRefresh={onRefresh}
            isMinimal={true}
        />
    );
}
