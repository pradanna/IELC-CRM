import { useMemo } from 'react';

/**
 * Custom hook to provide month and year data for filters.
 * 
 * @param {number} yearRange Number of years to show before/after the current year
 * @returns {object} { months, years, currentMonth, currentYear }
 */
export default function useMonthYear(yearRange = 1) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const months = useMemo(() => [
        { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
        { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
        { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ], []);

    const years = useMemo(() => {
        const yearsArray = [];
        for (let i = currentYear - yearRange; i <= currentYear + yearRange; i++) {
            yearsArray.push(i);
        }
        return yearsArray;
    }, [currentYear, yearRange]);

    return {
        months,
        years,
        currentMonth,
        currentYear
    };
}
