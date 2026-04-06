import { format, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Checks if a string is an ISO date.
 * If true, parses and formats it with date-fns using the Indonesian locale.
 * Otherwise, returns the original value.
 *
 * @param {any} value - The value to format
 * @param {string} dateFormat - The date-fns format string
 * @returns {any} Formatted string or original value
 */
export const formatIsoDateOrFallback = (value, dateFormat = 'dd MMM yyyy, HH:mm') => {
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        const date = parseISO(value);
        if (isValid(date)) {
            return format(date, dateFormat, { locale: id });
        }
    }
    return value;
};
