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
        
        const joinDate = new Date(joinDateStr);
        const end = new Date(endDate);
        
        if (joinDate > end) return 0;
        
        let count = 0;
        let current = new Date(joinDate);
        while (current <= end) {
            const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
            if (scheduleDays.includes(dayName)) {
                count++;
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
            // 1. Save plotting data
            await axios.post(route('admin.crm.leads.plot-class', lead.id), plottingForm);
            
            // 2. Compose and send WhatsApp notification
            if (selectedClass) {
                const schedule = (selectedClass.schedule_days || []).join(', ');
                const start = new Date(selectedClass.start_session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                const end = new Date(selectedClass.end_session_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                
                const isProRata = remainingMeetings < (selectedClass.total_meetings || 12);
                const fullPaymentNote = isProRata 
                    ? `\n\n*Note:* Karena Anda bergabung di tengah periode, biaya dihitung untuk sisa ${remainingMeetings} pertemuan saja (tidak perlu membayar full).`
                    : "";

                const costFormatted = new Intl.NumberFormat('id-ID').format(plottingForm.estimated_cost);

                const message = `Halo *${lead.nickname || lead.name}*,\n\n` +
                               `Kami telah menjadwalkan kelas untuk Anda di IELC:\n` +
                               `• *Kelas:* ${selectedClass.name}\n` +
                               `• *Jadwal:* ${schedule}\n` +
                               `• *Periode:* ${start} s/d ${end}\n` +
                               `• *Sisa:* ${remainingMeetings} Pertemuan\n` +
                            //    `• *Estimasi Biaya:* Rp ${costFormatted}` +
                               fullPaymentNote + 
                               `\n\nMohon konfirmasinya ya! Terima kasih! 👋`;

                await axios.post(route('admin.crm.leads.send-whatsapp', lead.id), { message });
            }

            onRefresh();
            alert('Plotting berhasil disimpan dan pemberitahuan WA terkirim.');
        } catch (err) {
            alert('Gagal memproses plotting: ' + (err.response?.data?.message || err.message));
        } finally {
            setSavingPlotting(false);
        }
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
