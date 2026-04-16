<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtQuestionGroup;
use Illuminate\Support\Facades\Storage;

class UpdatePtQuestionGroupAction
{
    public function handle(PtQuestionGroup $group, array $data): PtQuestionGroup
    {
        $groupData = [
            'instruction' => $data['instruction'],
            'section_type' => $data['section_type'] ?? null,
            'reading_text' => $data['reading_text'] ?? null,
        ];

        if (isset($data['media']) && $data['media']->isValid()) {
            if ($group->audio_path) {
                Storage::disk('public')->delete($group->audio_path);
            }
            $groupData['audio_path'] = $data['media']->store('pt_exams/audio', 'public');
        }

        if (isset($data['reading_file']) && $data['reading_file']->isValid()) {
            if ($group->file_path) {
                Storage::disk('public')->delete($group->file_path);
            }
            $groupData['file_path'] = $data['reading_file']->store('pt_exams/resources', 'public');
        }

        $group->update($groupData);

        return $group;
    }
}

