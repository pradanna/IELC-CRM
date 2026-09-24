<?php

namespace App\Domains\CRM\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsappMessage extends Model
{
    use HasUuids;

    protected $table = 'whatsapp_messages';

    protected $fillable = [
        'whatsapp_contact_id',
        'lead_id',
        'phone',
        'channel',
        'branch',
        'sender',
        'message',
        'media_url',
        'status',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(WhatsappContact::class, 'whatsapp_contact_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }
}
