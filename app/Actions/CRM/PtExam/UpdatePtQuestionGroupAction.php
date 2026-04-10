<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtQuestionGroup;
use Illuminate\Support\Facades\Storage;

class UpdatePtQuestionGroupAction
{
    public function execute(PtQuestionGroup $group, array $data): PtQuestionGroup
    {
        $groupData = [
            'instruction' => $data['instruction'],
            'reading_text' => $data['reading_text'] ?? null,
        ];

        if (isset($data['media']) && $data['media']->isValid()) {
            if ($group->audio_path) {
                Storage::disk('public')->delete($group->audio_path);
            }
            $groupData['audio_path'] = $data['media']->store('pt_exams/audio', 'public');
        }

        $group->update($groupData);

        return $group;
    }
}
