<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadChatLog;
use App\Domains\CRM\Domain\Models\WhatsappContact;
use App\Domains\CRM\Domain\Models\WhatsappMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
                    $intlPhone = str_starts_with($cleanDigits, '0') ? '62' . substr($cleanDigits, 1) : $cleanDigits;
                    $formattedPhone = '+' . $intlPhone;
                    $searchSuffix = strlen($cleanDigits) >= 9 ? substr($cleanDigits, -9) : $cleanDigits;
                    
                    $lead = Lead::where('phone', 'LIKE', "%{$searchSuffix}")->first();
                    $displayName = $lead ? $lead->name : 'No Name';

                    // 1. Catat atau perbarui WhatsappContact
                    $contact = WhatsappContact::findByPhone($formattedPhone, 'official');
                    if (!$contact) {
                        $contact = WhatsappContact::create([
                            'id'              => (string) Str::uuid(),
                            'phone'           => $formattedPhone,
                            'name'            => $displayName,
                            'channel'         => 'official',
                            'branch'          => null,
                            'lead_id'         => $lead?->id,
                            'last_message'    => $body,
                            'last_message_at' => now(),
                            'unread_count'    => 1,
                        ]);
                    } else {
                        $contact->update([
                            'last_message'    => $body,
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
                        'branch'              => null,
                        'channel'             => 'official',
                        'sender'              => 'contact',
                        'message'             => $body,
                        'status'              => 'received',
                    ]);

                    if ($lead) {
                        LeadChatLog::create([
                            'lead_id'       => $lead->id,
                            'lead_phase_id' => $lead->lead_phase_id,
                            'user_id'       => null,
                            'channel'       => 'official',
                            'message'       => $body,
                        ]);

                        $lead->update(['last_activity_at' => now()]);
                        Log::info("Meta WA Message saved and broadcasted for Lead #{$lead->id} ({$lead->name})");
                    } else {
                        Log::info("Meta WA Message from non-lead {$formattedPhone} saved to whatsapp_contacts.");
                    }

                    // 3. Broadcast real-time event ke Inbox
                    event(new \App\Events\WhatsappMessageReceived(
                        $lead,
                        $body,
                        'official',
                        $formattedPhone,
                        $contact->name
                    ));
                }
            }
        } catch (\Exception $e) {
            Log::error('Error processing Meta WA Official Webhook: ' . $e->getMessage());
        }

        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }
}
