<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\Master\Domain\Models\ChatTemplate;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadChatLog;
use App\Services\WhatsAppService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendLeadWhatsAppTemplate
{
    public function handle(Lead $lead, array $data): array
    {
        return DB::transaction(function () use ($lead, $data) {
            $template = ChatTemplate::findOrFail($data['chat_template_id']);
            
            // Determine consultation schedule if [JADWAL] placeholder exists
            $scheduleDate = $data['schedule_date'] ?? null;
            if (!$scheduleDate) {
                $latestConsultation = $lead->consultations()->latest('consultation_date')->first();
                if ($latestConsultation && $latestConsultation->consultation_date) {
                    $scheduleDate = $latestConsultation->consultation_date->translatedFormat('d F Y');
                }
            }

            // Generate self-registration/update form link if token available
            if (!$lead->self_registration_token) {
                $lead->update(['self_registration_token' => (string) \Illuminate\Support\Str::uuid()]);
            }
            $updateFormUrl = url("/fill-data/{$lead->self_registration_token}");

            // Render message with variables
            $search = ['{{name}}', '{{nickname}}', '{{lead_number}}', '{{admin_name}}', '[UPDATE_FORM]', '[update_form]', '[LINK_ZOHO]', '[link_zoho]'];
            $replace = [
                $lead->name ?: 'Kak', 
                $lead->nickname ?: ($lead->name ?: 'Kak'), 
                $lead->lead_number, 
                auth()->user()->name,
                $updateFormUrl,
                $updateFormUrl,
                $updateFormUrl,
                $updateFormUrl
            ];

            if ($scheduleDate) {
                $search[] = '[JADWAL]';
                $replace[] = $scheduleDate;
                $search[] = '[jadwal]';
                $replace[] = $scheduleDate;
            }

            $message = str_replace($search, $replace, $template->message);

            $lead->load('branch');
            $branchCode = $lead->branch?->code ?: 'solo';
            $phone = preg_replace('/[^0-9]/', '', $lead->phone);

            $whatsappService = app(WhatsAppService::class);
            
            $result = $whatsappService->sendMessage($branchCode, $phone, $message);

            if (!($result['success'] ?? false)) {
                $errorMsg = $result['message'] ?? $result['error'] ?? 'Unknown Gateway Error';
                Log::warning("WA Template Send Failed for Lead {$lead->id}: " . $errorMsg);
                throw new Exception('WhatsApp Gateway Error: ' . $errorMsg);
            }

            // Log it in Database for Chat History
            LeadChatLog::create([
                'lead_id'          => $lead->id,
                'chat_template_id' => $template->id,
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



