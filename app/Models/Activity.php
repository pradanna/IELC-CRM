<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Activity extends SpatieActivity
{
    use HasUuids;

    /**
     * Disable incrementing as we use UUIDs.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Set the key type to string.
     *
     * @var string
     */
    protected $keyType = 'string';

    protected $casts = [
        'properties' => 'collection',
        'extra_attributes' => 'collection',
    ];
}
