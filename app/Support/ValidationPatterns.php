<?php

namespace App\Support;

class ValidationPatterns
{
    /**
     * Regex untuk nomor telepon / WhatsApp Indonesia:
     * - Diawali dengan +628, 628, atau 08
     * - Digit setelah 8 harus 1-9
     * - Total panjang nomor valid 10 - 14 digit
     */
    public const PHONE_ID_REGEX = '/^(\+?62|0)8[1-9][0-9]{7,11}$/';

    /**
     * Pesan validasi standar nomor telepon Indonesia
     */
    public const PHONE_ID_MESSAGE = 'Format nomor telepon/WhatsApp tidak valid. Gunakan format seperti 081234567890 atau 6281234567890 (10-14 digit).';

    /**
     * Mengembalikan aturan array validasi phone ID
     *
     * @param bool $required
     * @return array
     */
    public static function phoneRules(bool $required = false): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            'max:20',
            'regex:' . self::PHONE_ID_REGEX,
        ];
    }
}
