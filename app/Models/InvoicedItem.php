<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoicedItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'invoice_id',
        'price_master_id',
        'name',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function priceMaster(): BelongsTo
    {
        return $this->belongsTo(PriceMaster::class);
    }
}
