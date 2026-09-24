<?php
/**
 * WhatsappWebhookController.php
 * Handles incoming events from the external Node.js WhatsApp Server.
 */

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Domains\CRM\Domain\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsappWebhookController extends Controller
{
    /**
     * Handle incoming message from Lead.
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
        
        // Ambil 10 digit terakhir untuk pencarian yang lebih fleksibel
        $searchSuffix = substr($clean, -10);

        // Cari lead berdasarkan 10 digit terakhir (asumsi format di DB beragam)
        $lead = Lead::where('phone', 'like', "%$searchSuffix")->first();

        $messageText = $validated['message'] ?? 'Media/Other message';

        if ($lead) {
            // Save to chat log for registered Lead
            \App\Domains\CRM\Domain\Models\LeadChatLog::create([
                'lead_id'       => $lead->id,
                'lead_phase_id' => $lead->lead_phase_id,
                'user_id'       => null,
                'channel'       => 'baileys',
                'message'       => $messageText,
            ]);

            // Broadcast real-time notification with lead context
            event(new \App\Events\WhatsappMessageReceived($lead, $messageText, 'baileys', '+' . $clean, $lead->name));

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
            // Kontak belum terdaftar sebagai Lead di CRM.
            // JANGAN insert ke tabel leads! Pesan sudah tersimpan di SQLite Baileys.
            // Cukup kirim event real-time ke Inbox WhatsApp agar CS melihat pesan masuk secara live.
            event(new \App\Events\WhatsappMessageReceived(null, $messageText, 'baileys', '+' . $clean, 'No Name'));

            Log::info("WA Webhook: Non-lead message received from +{$clean}. Broadcasted to Inbox without creating Lead.");
        }

        return response()->json(['success' => true, 'message' => 'Message processed successfully.']);
    }

    private function normalizePhone($phone)
    {
        // Fungsi ini sekarang hanya sebagai pembersih regex saja jika dipakai di tempat lain
        return preg_replace('/[^0-9]/', '', $phone);
    }
}


