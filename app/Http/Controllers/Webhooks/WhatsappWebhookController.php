<?php
/**
 * WhatsappWebhookController.php
 * Handles incoming events from the external Node.js WhatsApp Server.
 */

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Lead;
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

        if ($lead) {
            // Broadcast real-time notification (Setiap ada pesan masuk)
            event(new \App\Events\WhatsappMessageReceived($lead, $validated['message'] ?? 'Media/Other message'));
            
            Log::info("WA Webhook: Lead {$lead->id} matched via suffix %$searchSuffix");
            
            // Reset follow-up counter jika sedang dalam mode follow-up
            if ($lead->follow_up_count > 0) {
                $lead->update([
                    'follow_up_count' => 0,
                    'last_activity_at' => now(),
                ]);

                activity()
                    ->performedOn($lead)
                    ->log("Follow-up reset otomatis (Lead membalas di WhatsApp)");
            }

            return response()->json(['success' => true, 'message' => 'Lead found and updated.']);
        }

        return response()->json(['success' => false, 'message' => 'Lead not found.'], 404);
    }

    private function normalizePhone($phone)
    {
        // Fungsi ini sekarang hanya sebagai pembersih regex saja jika dipakai di tempat lain
        return preg_replace('/[^0-9]/', '', $phone);
    }
}
