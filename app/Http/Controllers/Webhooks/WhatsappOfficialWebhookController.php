<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadChatLog;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WhatsappOfficialWebhookController extends Controller
{
    /**
     * Handle Meta Webhook Verification (GET request).
     */
    public function verify(Request $request)
    {
        $verifyToken = env('WA_OFFICIAL_WEBHOOK_VERIFY_TOKEN', 'IELC_CRM_META_WEBHOOK_SECRET_2026');

        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode && $token) {
            if ($mode === 'subscribe' && $token === $verifyToken) {
                Log::info('Meta WA Official Webhook Verified Successfully!');
                return response($challenge, 200)->header('Content-Type', 'text/plain');
            }
        }

        Log::warning('Meta WA Official Webhook Verification Failed!', [
            'mode' => $mode,
            'token' => $token,
        ]);

        return response('Forbidden', 403);
    }

    /**
     * Handle Meta Incoming Webhook Events (POST request).
     */
    public function handle(Request $request)
    {
        $payload = $request->all();
        Log::info('Meta WA Official Webhook Event Received:', ['payload' => $payload]);

        try {
            $entry = $payload['entry'][0] ?? null;
            $changes = $entry['changes'][0] ?? null;
            $value = $changes['value'] ?? null;

            if ($value && isset($value['messages'][0])) {
                $msgData = $value['messages'][0];
                $fromPhone = $msgData['from'] ?? null; // e.g. 628975050520
                $msgType = $msgData['type'] ?? 'text';
                
                $body = '';
                if ($msgType === 'text') {
                    $body = $msgData['text']['body'] ?? '';
                } elseif ($msgType === 'button' || $msgType === 'interactive') {
                    $body = $msgData['button']['text'] ?? $msgData['interactive']['button_reply']['title'] ?? '[Interactive Response]';
                } else {
                    $body = "[Media message: {$msgType}]";
                }

                if ($fromPhone && $body) {
                    $cleanDigits = preg_replace('/[^0-9]/', '', $fromPhone);
                    $searchSuffix = substr($cleanDigits, -9);
                    $lead = Lead::where('phone', 'LIKE', "%{$searchSuffix}")->first();

                    if (!$lead) {
                        // Automatically create a new lead for this incoming WhatsApp number
                        $defaultBranch = \App\Domains\Master\Domain\Models\Branch::first();
                        $defaultPhase = \App\Domains\Master\Domain\Models\LeadPhase::where('code', 'lead')->first();
                        $waSource = \App\Domains\Master\Domain\Models\LeadSource::where('name', 'LIKE', '%WhatsApp%')->first()
                            ?? \App\Domains\Master\Domain\Models\LeadSource::first();
                        $waInfo = \App\Domains\Master\Domain\Models\InfoSource::where('name', 'LIKE', '%WhatsApp%')->first()
                            ?? \App\Domains\Master\Domain\Models\InfoSource::first();

                        $lead = Lead::create([
                            'id' => (string) \Illuminate\Support\Str::uuid(),
                            'lead_number' => "L-" . now()->format('Ymd-His') . rand(10, 99),
                            'name' => 'No Name',
                            'phone' => '+' . $cleanDigits,
                            'branch_id' => $defaultBranch?->id ?? 1,
                            'owner_id' => null,
                            'created_by' => null,
                            'lead_source_id' => $waSource?->id,
                            'info_source_id' => $waInfo?->id,
                            'lead_phase_id' => $defaultPhase?->id,
                            'last_activity_at' => now(),
                        ]);

                        Log::info("Created new record (No Name) #{$lead->id} for incoming WA Official chat from +{$cleanDigits}");
                    }

                    LeadChatLog::create([
                        'lead_id'       => $lead->id,
                        'lead_phase_id' => $lead->lead_phase_id,
                        'user_id'       => null, // Incoming message from customer
                        'channel'       => 'official',
                        'message'       => $body,
                    ]);

                    // Update lead last activity
                    $lead->update(['last_activity_at' => now()]);

                    // Broadcast real-time event so WhatsApp Web inbox receives it immediately
                    event(new \App\Events\WhatsappMessageReceived($lead, $body, 'official'));

                    Log::info("Meta WA Message saved and broadcasted for Lead #{$lead->id} ({$lead->name})");
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing Meta WA Official Webhook: ' . $e->getMessage());
        }

        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }
}
