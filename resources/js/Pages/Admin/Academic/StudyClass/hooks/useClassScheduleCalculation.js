import { useEffect, useRef, useCallback } from 'react';
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
 * Calculates completion date given start date, total meetings, and days of week.
 */
export function calculateCompletionDate(startDateStr, totalMeetings, scheduleDays) {
    if (!startDateStr || !totalMeetings || !Array.isArray(scheduleDays) || scheduleDays.length === 0) {
        return null;
    }

    const startDate = parseISO(startDateStr);
    if (!isValid(startDate)) return null;

    const targetDays = scheduleDays.map(day => DAY_MAP[day]);
    const total = parseInt(totalMeetings);
    
    if (isNaN(total) || total <= 0) return null;

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
        return format(currentDate, 'yyyy-MM-dd');
    }
    return null;
}

/**
 * Custom hook to automate class schedule calculations without locking/reverting manual overrides.
 */
export default function useClassScheduleCalculation(data, setData, isOpen = true) {
    const prevInputsRef = useRef({
        start: null,
        total: null,
        daysKey: null,
        initialized: false
    });

    // Reset tracking ref when modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            prevInputsRef.current = {
                start: null,
                total: null,
                daysKey: null,
                initialized: false
            };
        }
    }, [isOpen]);

    // 1. Sync meetings_per_week with schedule_days count
    const scheduleDaysCount = Array.isArray(data.schedule_days) ? data.schedule_days.length : 0;
    useEffect(() => {
        if (scheduleDaysCount > 0 && scheduleDaysCount !== parseInt(data.meetings_per_week)) {
            setData('meetings_per_week', scheduleDaysCount);
        }
    }, [scheduleDaysCount]);

    // 2. Calculate end_session_date ONLY when the scheduling parameters actually change
    const startSessionDate = data.start_session_date;
    const totalMeetings = data.total_meetings;
    const scheduleDaysKey = Array.isArray(data.schedule_days) ? [...data.schedule_days].sort().join(',') : '';

    useEffect(() => {
        if (!isOpen) return;

        // First initialization for this modal session
        if (!prevInputsRef.current.initialized) {
            prevInputsRef.current = {
                start: startSessionDate,
                total: totalMeetings,
                daysKey: scheduleDaysKey,
                initialized: true
            };

            // If an end_session_date already exists (e.g. editing an existing class from DB),
            // DO NOT overwrite it on modal open!
            if (data.end_session_date) {
                return;
            }
        }

        const startChanged = prevInputsRef.current.start !== startSessionDate;
        const totalChanged = prevInputsRef.current.total !== totalMeetings;
        const daysChanged = prevInputsRef.current.daysKey !== scheduleDaysKey;

        // If none of the schedule inputs changed, DO NOT recalculate (e.g. user manually picked end_session_date)
        if (!startChanged && !totalChanged && !daysChanged) {
            return;
        }

        // Update tracking reference to the new values
        prevInputsRef.current.start = startSessionDate;
        prevInputsRef.current.total = totalMeetings;
        prevInputsRef.current.daysKey = scheduleDaysKey;

        const calculatedDate = calculateCompletionDate(startSessionDate, totalMeetings, data.schedule_days);
        if (calculatedDate && calculatedDate !== data.end_session_date) {
            setData('end_session_date', calculatedDate);
        }
    }, [startSessionDate, totalMeetings, scheduleDaysKey, isOpen]);

    // Explicit manual recalculation function for user convenience
    const recalculateTargetCompletion = useCallback(() => {
        const calculatedDate = calculateCompletionDate(data.start_session_date, data.total_meetings, data.schedule_days);
        if (calculatedDate) {
            setData('end_session_date', calculatedDate);
        }
    }, [data.start_session_date, data.total_meetings, data.schedule_days]);

    return { recalculateTargetCompletion };
}
