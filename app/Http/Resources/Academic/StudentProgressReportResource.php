<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class StudentProgressReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'title' => $this->title,
            'file_name' => $this->file_name,
            'file_type' => $this->file_type,
            'file_url' => $this->file_path ? Storage::disk('public')->url($this->file_path) : null,
            'created_at' => $this->created_at ? $this->created_at->format('d M Y H:i') : null,
            'formatted_date' => $this->created_at ? $this->created_at->format('d M Y') : null,
        ];
    }
}
