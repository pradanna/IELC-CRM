<?php

namespace App\Actions\CRM\Leads;

use App\Models\ChatTemplate;
use App\Models\Lead;
use App\Models\LeadChatLog;
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
            
            // Render message with variables
            $message = str_replace(
                ['{{name}}', '{{nickname}}', '{{lead_number}}', '{{admin_name}}'],
                [
                    $lead->name ?: 'Kak', 
                    $lead->nickname ?: ($lead->name ?: 'Kak'), 
                    $lead->lead_number, 
                    auth()->user()->name
                ],
                $template->message
            );

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

            // Log it in Database
            LeadChatLog::create([
                'lead_id'          => $lead->id,
                'chat_template_id' => $template->id,
                'lead_phase_id'    => $lead->lead_phase_id,
                'user_id'          => auth()->id(),
                'message'          => $message,
            ]);

            return $result;
        });
    }
}
