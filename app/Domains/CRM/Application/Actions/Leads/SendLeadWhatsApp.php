<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadChatLog;
use App\Services\WhatsAppService;
use Exception;
use Illuminate\Support\Facades\DB;

class SendLeadWhatsApp
{
    public function handle(Lead $lead, array $data): array
    {
        return DB::transaction(function () use ($lead, $data) {
            $message = $data['message'];
            
            $lead->load('branch');
            $branchCode = $lead->branch?->code ?: 'solo';
            $phone = preg_replace('/[^0-9]/', '', $lead->phone);

            $whatsappService = app(WhatsAppService::class);
            
            $result = $whatsappService->sendMessage($branchCode, $phone, $message);

            if (!($result['success'] ?? false)) {
                throw new Exception('WhatsApp Gateway Error: ' . ($result['message'] ?? 'Unknown error'));
            }

            // Log it in Database for Chat History
            LeadChatLog::create([
                'lead_id'          => $lead->id,
                'lead_phase_id'    => $lead->lead_phase_id,
                'user_id'          => auth()->id(),
                'message'          => $message,
            ]);

            // Record Activity for Daily Performance Reporting
            \App\Domains\CRM\Domain\Models\LeadActivity::create([
                'lead_id'     => $lead->id,
                'user_id'     => auth()->id(),
                'type'        => 'message',
                'description' => $message,
            ]);

            // Record Follow-Up Tracking
            $now = now();
            if ($lead->follow_up_count === 0 || !$lead->last_activity_at || !$lead->last_activity_at->isToday()) {
                $lead->increment('follow_up_count');
            }
            $lead->update(['last_activity_at' => $now]);

            // Automation: 4x Follow-up -> Cold Leads
            $coldPhase = \App\Domains\Master\Domain\Models\LeadPhase::where('code', 'cold-leads')->first();
            if ($lead->follow_up_count >= 4 && $coldPhase && $lead->lead_phase_id !== $coldPhase->id) {
                $lead->update(['lead_phase_id' => $coldPhase->id]);
            }

            return $result;
        });
    }
}



