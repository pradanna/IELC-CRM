/**
 * Hook for handling WhatsApp interactions
 */
export default function useWhatsapp() {
    /**
     * Formats a phone number for WhatsApp and opens the link
     * @param {string} phone 
     * @param {string} message (optional)
     */
    const openWhatsapp = (phone, message = '') => {
        if (!phone) {
            alert('Nomor WhatsApp tidak ditemukan!');
            return;
        }

        // 1. Strip all non-digit characters
        let cleanPhone = phone.replace(/\D/g, '');

        // 2. Validation & Normalization
        if (cleanPhone.startsWith('0')) {
            // Convert 08... to 628...
            cleanPhone = '62' + cleanPhone.substring(1);
        }

        // 3. Length check
        if (cleanPhone.length < 10) {
            alert('Nomor WhatsApp terlalu pendek!');
            return;
        }

        // 4. Open link
        let waUrl = `https://wa.me/${cleanPhone}`;
        if (message) {
            waUrl += `?text=${encodeURIComponent(message)}`;
        }
        
        window.open(waUrl, '_blank');
    };

    return { openWhatsapp };
}
