<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MediaAsset extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'file_name',
        'file_path',
        'mime_type',
        'size',
    ];
}
