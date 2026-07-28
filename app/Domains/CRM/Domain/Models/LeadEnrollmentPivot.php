<?php

namespace App\Domains\CRM\Domain\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

class LeadEnrollmentPivot extends Pivot
{
    use HasUuids;

    protected $table = 'lead_enrollments';
    public $incrementing = false;
    protected $keyType = 'string';
}
