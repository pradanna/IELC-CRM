<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeadRegistration extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'nickname',
        'phone',
        'email',
        'gender',
        'birth_date',
        'school',
        'grade',
        'branch_id',
        'province',
        'city',
        'address',
        'postal_code',
        'guardian_data',
        'lead_source_id',
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'guardian_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function leadSource()
    {
        return $this->belongsTo(LeadSource::class);
    }
}
