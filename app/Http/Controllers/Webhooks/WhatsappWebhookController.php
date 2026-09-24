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

        if (!$lead) {
            $branch = null;
            if (!empty($validated['branch'])) {
                $bCode = $validated['branch'];
                $branch = \App\Domains\Master\Domain\Models\Branch::where('code', strtolower($bCode))
                    ->orWhere('code', strtoupper($bCode))
                    ->first();
            }
            $defaultBranch = $branch ?? \App\Domains\Master\Domain\Models\Branch::first();
            $defaultPhase = \App\Domains\Master\Domain\Models\LeadPhase::where('code', 'lead')->first();
            $waSource = \App\Domains\Master\Domain\Models\LeadSource::where('name', 'LIKE', '%WhatsApp%')->first()
                ?? \App\Domains\Master\Domain\Models\LeadSource::first();
            $waInfo = \App\Domains\Master\Domain\Models\InfoSource::where('name', 'LIKE', '%WhatsApp%')->first()
                ?? \App\Domains\Master\Domain\Models\InfoSource::first();
            $defaultUser = \App\Domains\Shared\Domain\Models\User::first();

            $lead = Lead::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'lead_number' => "L-" . now()->format('Ymd-His') . rand(10, 99),
                'name' => 'No Name',
                'phone' => '+' . $clean,
                'branch_id' => $defaultBranch?->id,
                'owner_id' => $defaultUser?->id,
                'created_by' => $defaultUser?->id,
                'lead_source_id' => $waSource?->id,
                'info_source_id' => $waInfo?->id,
                'lead_phase_id' => $defaultPhase?->id,
                'last_activity_at' => now(),
            ]);

            Log::info("WA Webhook: Created new record (No Name) #{$lead->id} for +{$clean}");
        }

        // Save to chat log
        \App\Domains\CRM\Domain\Models\LeadChatLog::create([
            'lead_id'       => $lead->id,
            'lead_phase_id' => $lead->lead_phase_id,
            'user_id'       => null,
            'channel'       => 'baileys',
            'message'       => $validated['message'] ?? 'Media/Other message',
        ]);

        // Broadcast real-time notification (Setiap ada pesan masuk)
        event(new \App\Events\WhatsappMessageReceived($lead, $validated['message'] ?? 'Media/Other message', 'baileys'));
        
        Log::info("WA Webhook: Lead {$lead->id} message processed.");
        
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

        return response()->json(['success' => true, 'message' => 'Lead message received and processed.']);
    }

    private function normalizePhone($phone)
    {
        // Fungsi ini sekarang hanya sebagai pembersih regex saja jika dipakai di tempat lain
        return preg_replace('/[^0-9]/', '', $phone);
    }
}


