<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Models\ChatTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ChatTemplateController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'          => ['required', 'string', 'max:255'],
            'message'        => ['required', 'string'],
            'lead_phase_ids' => ['array', 'nullable'],
            'lead_phase_ids.*' => ['uuid', 'exists:lead_phases,id'],
            'lead_type_ids'  => ['array', 'nullable'],
            'lead_type_ids.*'  => ['uuid', 'exists:lead_types,id'],
        ]);

        $chatTemplate = ChatTemplate::create([
            'title'   => $validated['title'],
            'message' => $validated['message'],
        ]);

        if (!empty($validated['lead_phase_ids'])) {
            $chatTemplate->leadPhases()->sync($validated['lead_phase_ids']);
        }
        
        if (!empty($validated['lead_type_ids'])) {
            $chatTemplate->leadTypes()->sync($validated['lead_type_ids']);
        }

        return redirect()->back()->with('success', 'Template chat berhasil ditambahkan.');
    }

    public function update(Request $request, ChatTemplate $chatTemplate): RedirectResponse
    {
        $validated = $request->validate([
            'title'          => ['required', 'string', 'max:255'],
            'message'        => ['required', 'string'],
            'lead_phase_ids' => ['array', 'nullable'],
            'lead_phase_ids.*' => ['uuid', 'exists:lead_phases,id'],
            'lead_type_ids'  => ['array', 'nullable'],
            'lead_type_ids.*'  => ['uuid', 'exists:lead_types,id'],
        ]);

        $chatTemplate->update([
            'title'   => $validated['title'],
            'message' => $validated['message'],
        ]);

        $chatTemplate->leadPhases()->sync($validated['lead_phase_ids'] ?? []);
        $chatTemplate->leadTypes()->sync($validated['lead_type_ids'] ?? []);

        return redirect()->back()->with('success', 'Template chat berhasil diperbarui.');
    }

    public function destroy(ChatTemplate $chatTemplate): RedirectResponse
    {
        // Many-to-Many relations will be cascaded by DB foreign key or automatically detached
        $chatTemplate->delete();

        return redirect()->back()->with('success', 'Template chat berhasil dihapus.');
    }
}
