<?php

namespace App\Domains\CRM\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsappContact extends Model
{
    use HasUuids;

    protected $table = 'whatsapp_contacts';

    protected $fillable = [
        'phone',
        'name',
        'channel',
        'branch',
        'lead_id',
        'last_message',
        'last_message_at',
        'unread_count',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'unread_count' => 'integer',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsappMessage::class, 'whatsapp_contact_id');
    }

    /**
     * Find existing contact by flexible phone matching (last 8-10 digits).
     */
    public static function findByPhone(string $phone, ?string $channel = null, ?string $branch = null): ?self
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);
        $suffix = strlen($clean) >= 8 ? substr($clean, -8) : $clean;

        if (empty($suffix)) {
            return null;
        }

        $query = static::where('phone', 'like', "%{$suffix}");

        if ($channel) {
            $query->where('channel', $channel);
        }

        if ($branch) {
            $query->where(function ($q) use ($branch) {
                $q->where('branch', strtolower($branch))
                  ->orWhereNull('branch');
            });
        }

        return $query->first();
    }
}
