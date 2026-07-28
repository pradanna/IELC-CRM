import { useState, useEffect } from 'react';
import axios from 'axios';

export default function useLeadPlotting(lead, availableClasses, onRefresh) {
    const [savingPlotting, setSavingPlotting] = useState(false);
    const [plottingForm, setPlottingForm] = useState({
        study_class_id: lead?.plotting?.study_class_id || '',
        join_date: lead?.plotting?.join_date || new Date().toISOString().split('T')[0],
        notes: lead?.plotting?.notes || '',
        estimated_cost: lead?.plotting?.estimated_cost || ''
    });

    const selectedClass = availableClasses.find(c => c.id === plottingForm.study_class_id);

    const calculateRemainingMeetings = (startDate, endDate, scheduleDays, joinDateStr) => {
        if (!startDate || !endDate || !scheduleDays || !joinDateStr) return 0;
        
        const rawJoinDate = new Date(joinDateStr);
        const day = rawJoinDate.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const joinDate = new Date(rawJoinDate);
        joinDate.setDate(rawJoinDate.getDate() + diffToMonday);
        joinDate.setHours(0, 0, 0, 0);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        if (joinDate > end) return 0;
        
        let count = 0;
        let current = new Date(joinDate);
        while (current <= end) {
            if (current >= start) {
                const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
                if (scheduleDays.includes(dayName)) {
                    count++;
                }
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    };

    const remainingMeetings = selectedClass ? calculateRemainingMeetings(
        selectedClass.start_session_date,
        selectedClass.end_session_date,
        selectedClass.schedule_days,
        plottingForm.join_date
    ) : 0;

    // Auto-calculate estimated cost
    useEffect(() => {
        if (selectedClass && remainingMeetings > 0) {
            const totalPrice = selectedClass.price_master?.price_per_session || 0;
            const totalMeetings = selectedClass.total_meetings || 12;
            const pricePerMeeting = totalPrice / totalMeetings;
            const autoCost = Math.round(pricePerMeeting * remainingMeetings);
            
            setPlottingForm(prev => ({ ...prev, estimated_cost: autoCost }));
        } else if (!selectedClass) {
            setPlottingForm(prev => ({ ...prev, estimated_cost: '' }));
        }
    }, [plottingForm.study_class_id, remainingMeetings]);

    const handleSavePlotting = async () => {
        setSavingPlotting(true);
        
        try {
            await axios.post(route('admin.crm.leads.plot-class', lead.id), plottingForm);
            alert('Plotting berhasil disimpan.');
        } catch (err) {
            alert('Gagal menyimpan plotting: ' + (err.response?.data?.message || err.message));
            setSavingPlotting(false);
            return;
        }

        onRefresh(true);
        setSavingPlotting(false);
    };

    return {
        plottingForm,
        setPlottingForm,
        selectedClass,
        remainingMeetings,
        savingPlotting,
        handleSavePlotting
    };
}
