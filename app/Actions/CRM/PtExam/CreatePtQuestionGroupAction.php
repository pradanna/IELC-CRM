<?php

namespace App\Actions\Crm\PtExam;

use App\Models\PtQuestionGroup;
use Illuminate\Support\Facades\Storage;

class CreatePtQuestionGroupAction
{
    public function execute(array $data): PtQuestionGroup
    {
        $groupData = [
            'pt_exam_id' => $data['pt_exam_id'],
            'instruction' => $data['instruction'],
            'reading_text' => $data['reading_text'] ?? null,
        ];

        if (isset($data['media']) && $data['media']->isValid()) {
            $groupData['audio_path'] = $data['media']->store('pt_exams/audio', 'public');
        }

        return PtQuestionGroup::create($groupData);
    }
}
