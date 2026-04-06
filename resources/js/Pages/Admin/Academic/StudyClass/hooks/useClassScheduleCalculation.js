import { useEffect } from 'react';
import { addDays, getDay, parseISO, isValid, format } from 'date-fns';

const DAY_MAP = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
};

/**
 * Custom hook to automate class schedule calculations.
 * Updates end_session_date and meetings_per_week based on inputs.
 */
export default function useClassScheduleCalculation(data, setData) {
    // 1. Sync meetings_per_week with schedule_days length
    useEffect(() => {
        const count = Array.isArray(data.schedule_days) ? data.schedule_days.length : 0;
        if (count > 0 && count !== parseInt(data.meetings_per_week)) {
            setData('meetings_per_week', count);
        }
    }, [data.schedule_days]);

    // 2. Calculate end_session_date
    useEffect(() => {
        const { start_session_date, total_meetings, schedule_days } = data;

        if (!start_session_date || !total_meetings || !Array.isArray(schedule_days) || schedule_days.length === 0) {
            return;
        }

        const startDate = parseISO(start_session_date);
        if (!isValid(startDate)) return;

        const targetDays = schedule_days.map(day => DAY_MAP[day]);
        const total = parseInt(total_meetings);
        
        if (isNaN(total) || total <= 0) return;

        let meetingCount = 0;
        let currentDate = new Date(startDate);
        let iterations = 0;
        const maxIterations = 2000; // Safety cap (approx 5 years)

        while (meetingCount < total && iterations < maxIterations) {
            if (targetDays.includes(getDay(currentDate))) {
                meetingCount++;
                if (meetingCount === total) {
                    break;
                }
            }
            currentDate = addDays(currentDate, 1);
            iterations++;
        }

        if (meetingCount === total) {
            const finalDate = format(currentDate, 'yyyy-MM-dd');
            if (finalDate !== data.end_session_date) {
                setData('end_session_date', finalDate);
            }
        }
    }, [data.start_session_date, data.total_meetings, data.schedule_days]);
}
