/**
 * Validasi dan Utilitas Terpusat IELC-CRM
 */

// Regex format nomor HP / WhatsApp Indonesia
export const PHONE_ID_REGEX = /^(\+?62|0)8[1-9][0-9]{7,11}$/;

// Regex format Email standar RFC 5322 sederhana
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Filter karakter input telepon: hanya izinkan angka dan simbol '+' di awal
 */
export function sanitizePhoneInput(value) {
    if (!value) return '';
    let cleaned = value.replace(/[^0-9+]/g, '');
    // Jika tanda '+' ada di tengah/lebih dari satu, hanya biarkan di karakter index 0
    if (cleaned.includes('+')) {
        const hasLeadingPlus = cleaned.startsWith('+');
        cleaned = cleaned.replace(/\+/g, '');
        if (hasLeadingPlus) {
            cleaned = '+' + cleaned;
        }
    }
    return cleaned;
}

/**
 * Validasi apakah nomor telepon sesuai pola Indonesia
 */
export function isValidIndonesianPhone(phone) {
    if (!phone) return false;
    return PHONE_ID_REGEX.test(phone.trim());
}

/**
 * Validasi format email
 */
export function isValidEmail(email) {
    if (!email) return false;
    return EMAIL_REGEX.test(email.trim());
}
