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
        $validated = $request->validate([
            'phone' => 'required|string',
            'message' => 'nullable|string',
            'branch' => 'nullable|string',
        ]);

        $phone = $this->normalizePhone($validated['phone']);

        // Cari lead berdasarkan HP (asumsi format di DB konsisten)
        $lead = Lead::where('phone', 'like', "%$phone%")->first();

        if ($lead) {
            // Reset follow-up counter karena lead merespons
            if ($lead->follow_up_count > 0) {
                $lead->update([
                    'follow_up_count' => 0,
                    'last_activity_at' => now(),
                ]);

                activity()
                    ->performedOn($lead)
                    ->log("Follow-up reset otomatis (Lead membalas di WhatsApp)");

                Log::info("WA Webhook: Lead {$lead->id} responded. Counter reset.");
            }

            return response()->json(['success' => true, 'message' => 'Lead found and updated.']);
        }

        return response()->json(['success' => false, 'message' => 'Lead not found.'], 404);
    }

    private function normalizePhone(string $phone): string
    {
        // Hilangkan karakter non-digit
        $clean = preg_replace('/[^0-9]/', '', $phone);
        
        // Standarisasi ke format 62 jika mulai dari 0 atau 8
        if (str_starts_with($clean, '0')) {
            $clean = '62' . substr($clean, 1);
        } elseif (str_starts_with($clean, '8')) {
            $clean = '62' . $clean;
        }

        return $clean;
    }
}
