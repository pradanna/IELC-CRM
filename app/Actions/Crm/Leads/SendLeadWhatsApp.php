<?php

namespace App\Actions\Crm\Leads;

use App\Models\Lead;
use App\Models\LeadChatLog;
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

            // Log it in Database
            LeadChatLog::create([
                'lead_id'          => $lead->id,
                'lead_phase_id'    => $lead->lead_phase_id,
                'user_id'          => auth()->id(),
                'message'          => $message,
            ]);

            return $result;
        });
    }
}

