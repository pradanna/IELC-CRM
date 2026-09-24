<?php
/**
 * WhatsappWebhookController.php
 * Handles incoming events from the external Node.js WhatsApp Server.
 */

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadChatLog;
use App\Domains\CRM\Domain\Models\WhatsappContact;
use App\Domains\CRM\Domain\Models\WhatsappMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsappWebhookController extends Controller
{
    /**
     * Handle incoming message from WhatsApp Node.js server.
     * Expected JSON: { "phone": "628...", "message": "...", "branch": "solo" }
     */
    public function handleIncomingMessage(Request $request): JsonResponse
    {
        Log::info("WA Webhook Inbound Call Received", $request->all());

        $validated = $request->validate([
            'phone' => 'required|string',
            'message' => 'nullable|string',
            'branch' => 'nullable|string',
        ]);

        $clean = preg_replace('/[^0-9]/', '', $validated['phone']);
        $intlPhone = str_starts_with($clean, '0') ? '62' . substr($clean, 1) : $clean;
        $formattedPhone = '+' . $intlPhone;
        $branchName = strtolower($validated['branch'] ?? 'solo');
        
        // Ambil 9-10 digit terakhir untuk pencarian lead
        $searchSuffix = strlen($clean) >= 9 ? substr($clean, -9) : $clean;

        // Cari apakah kontak sudah ada di tabel Leads
        $lead = Lead::where('phone', 'like', "%{$searchSuffix}")->first();
        $messageText = $validated['message'] ?? 'Media/Other message';

        // 1. Catat atau perbarui kontak di whatsapp_contacts
        $contact = WhatsappContact::findByPhone($formattedPhone, 'baileys', $branchName);
        $displayName = $lead ? $lead->name : 'No Name';

        if (!$contact) {
            $contact = WhatsappContact::create([
                'id'              => (string) Str::uuid(),
                'phone'           => $formattedPhone,
                'name'            => $displayName,
                'channel'         => 'baileys',
                'branch'          => $branchName,
                'lead_id'         => $lead?->id,
                'last_message'    => $messageText,
                'last_message_at' => now(),
                'unread_count'    => 1,
            ]);
        } else {
            $contact->update([
                'last_message'    => $messageText,
                'last_message_at' => now(),
                'unread_count'    => ($contact->unread_count ?? 0) + 1,
                'lead_id'         => $lead?->id ?? $contact->lead_id,
                'name'            => $lead ? $lead->name : ($contact->name ?: 'No Name'),
            ]);
        }

        // 2. Simpan pesan masuk ke tabel whatsapp_messages
        WhatsappMessage::create([
            'id'                  => (string) Str::uuid(),
            'whatsapp_contact_id' => $contact->id,
            'lead_id'             => $lead?->id,
            'phone'               => $formattedPhone,
            'branch'              => $branchName,
            'channel'             => 'baileys',
            'sender'              => 'contact',
            'message'             => $messageText,
            'status'              => 'received',
        ]);

        if ($lead) {
            // Save to chat log for registered Lead (for CRM Lead detail drawer)
            LeadChatLog::create([
                'lead_id'       => $lead->id,
                'lead_phase_id' => $lead->lead_phase_id,
                'user_id'       => null,
                'channel'       => 'baileys',
                'message'       => $messageText,
            ]);

            // Reset follow-up counter jika sedang dalam mode follow-up
            if ($lead->follow_up_count > 0) {
                $lead->update([
                    'follow_up_count' => 0,
                    'last_activity_at' => now(),
                ]);

                activity()
                    ->performedOn($lead)
                    ->log("Follow-up reset otomatis (Lead membalas di WhatsApp)");
            } else {
                $lead->update(['last_activity_at' => now()]);
            }

            Log::info("WA Webhook: Lead {$lead->id} ({$lead->name}) message processed.");
        } else {
            Log::info("WA Webhook: Non-lead message from {$formattedPhone} stored in whatsapp_contacts.");
        }

        // 3. Broadcast real-time notification
        event(new \App\Events\WhatsappMessageReceived(
            $lead,
            $messageText,
            'baileys',
            $formattedPhone,
            $contact->name
        ));

        return response()->json(['success' => true, 'message' => 'Message processed successfully.']);
    }

    private function normalizePhone($phone)
    {
        return preg_replace('/[^0-9]/', '', $phone);
    }
}
