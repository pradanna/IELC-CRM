<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Http\Controllers\Controller;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadChatLog;
use App\Domains\CRM\Domain\Models\WhatsappContact;
use App\Domains\CRM\Domain\Models\WhatsappMessage;
use App\Domains\Academic\Domain\Models\Student;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WhatsappInboxController extends Controller
{
    protected WhatsAppService $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Render the main WhatsApp Inbox Page.
     */
    public function index(Request $request): Response
    {
        $branches = Branch::all(['id', 'name', 'code']);
        $initialTab = $request->query('tab', 'baileys');

        return Inertia::render('Admin/Crm/Whatsapp/Inbox', [
            'branches' => $branches,
            'officialPhone' => config('services.whatsapp_official.number', env('WA_OFFICIAL_NUMBER', '-')),
            'officialStatus' => env('WA_OFFICIAL_TOKEN') ? 'connected' : 'disconnected',
            'initialTab' => $initialTab,
        ]);
    }

    /**
     * Get conversation contact list for WA Official.
     */
    public function getOfficialConversations(Request $request): JsonResponse
    {
        $allItems = collect();
        $seenPhones = [];

        // 1. Ambil kontak WhatsApp Official yang tersimpan di whatsapp_contacts
        $waContacts = WhatsappContact::where('channel', 'official')
            ->with('lead')
            ->orderByDesc('last_message_at')
            ->get();

        foreach ($waContacts as $c) {
            $digits = preg_replace('/[^0-9]/', '', $c->phone);
            if (strlen($digits) < 8) continue;
            $suffix = substr($digits, -9);
            $seenPhones[$suffix] = true;

            $lead = $c->lead;
            if (!$lead && $c->lead_id) {
                $lead = Lead::find($c->lead_id);
            }
            if (!$lead) {
                $lead = Lead::where('phone', 'like', "%{$suffix}")->first();
            }

            $name = $lead ? $lead->name : $c->name;
            $isNoName = empty($name) 
                || strtolower(trim($name)) === 'no name' 
                || strtolower(trim($name)) === '(no name)'
                || str_starts_with($name, '+')
                || str_starts_with($name, 'WA +');

            $displayName = $isNoName ? 'No Name' : $name;
            $contactType = ($lead || $c->lead_id) ? ($isNoName ? 'non-lead' : 'lead') : 'non-lead';

            $lastTime = $c->last_message_at ?? $c->updated_at;
            $formattedTime = '';
            if ($lastTime) {
                $formattedTime = $lastTime->isToday() 
                    ? $lastTime->format('H:i') 
                    : $lastTime->format('d M H:i');
            }

            $allItems->push([
                'id' => 'official_contact_' . $c->id,
                'name' => $displayName,
                'is_lead' => !$isNoName && ($lead || $c->lead_id),
                'phone' => $c->phone,
                'type' => $contactType,
                'crm_id' => $lead?->id ?? $c->lead_id,
                'avatar' => null,
                'last_message' => $c->last_message ?: 'Belum ada pesan',
                'last_message_time' => $formattedTime ?: date('H:i'),
                'sort_timestamp' => $lastTime ? $lastTime->timestamp : 0,
                'unread_count' => $c->unread_count ?? 0,
                'channel' => 'official',
            ]);
        }

        // 2. Sertakan juga CRM Leads untuk Official yang belum ada di whatsapp_contacts
        $leads = Lead::whereNotNull('phone')
            ->where('phone', '!=', '')
            ->with(['chatLogs' => function ($query) {
                $query->where('channel', 'official')->latest();
            }])
            ->latest('updated_at')
            ->take(50)
            ->get(['id', 'name', 'phone', 'lead_phase_id', 'updated_at', 'created_at']);

        foreach ($leads as $lead) {
            $digits = preg_replace('/[^0-9]/', '', $lead->phone);
            if (strlen($digits) < 8) continue;
            $suffix = substr($digits, -9);
            if (isset($seenPhones[$suffix])) continue;

            $latestLog = $lead->chatLogs->first();
            $lastTime = $latestLog ? $latestLog->created_at : ($lead->updated_at ?? $lead->created_at);
            $formattedTime = '';
            if ($lastTime) {
                $formattedTime = $lastTime->isToday() 
                    ? $lastTime->format('H:i') 
                    : $lastTime->format('d M H:i');
            }

            $isNoName = empty($lead->name) 
                || strtolower(trim($lead->name)) === 'no name' 
                || strtolower(trim($lead->name)) === '(no name)'
                || str_starts_with($lead->name, '+')
                || str_starts_with($lead->name, 'WA +');

            $displayName = $isNoName ? 'No Name' : $lead->name;
            $contactType = $isNoName ? 'non-lead' : 'lead';

            $allItems->push([
                'id' => 'official_lead_' . $lead->id,
                'name' => $displayName,
                'is_lead' => !$isNoName,
                'phone' => $lead->phone,
                'type' => $contactType,
                'crm_id' => $lead->id,
                'avatar' => null,
                'last_message' => $latestLog ? $latestLog->message : 'Belum ada pesan',
                'last_message_time' => $formattedTime ?: date('H:i'),
                'sort_timestamp' => $latestLog ? $latestLog->created_at->timestamp : ($lead->updated_at ? $lead->updated_at->timestamp : 0),
                'unread_count' => 0,
                'channel' => 'official',
            ]);
        }

        $contacts = $allItems->sortByDesc('sort_timestamp')->values();

        return response()->json([
            'status' => 'success',
            'data' => $contacts,
        ]);
    }

    /**
     * Get conversation contact list for WA Baileys (Unified for all branches).
     */
    public function getBaileysConversations(?string $branchCode = null, Request $request = null): JsonResponse
    {
        $allItems = collect();
        $seenPhones = [];

        // 1. Ambil kontak dari tabel whatsapp_contacts (termasuk non-lead) - Semua branch jadi 1
        $waContacts = WhatsappContact::where('channel', 'baileys')
            ->with(['lead.branch'])
            ->orderByDesc('last_message_at')
            ->get();

        foreach ($waContacts as $c) {
            $digits = preg_replace('/[^0-9]/', '', $c->phone);
            if (strlen($digits) < 8) continue;
            $suffix = substr($digits, -9);
            $seenPhones[$suffix] = true;

            $lead = $c->lead;
            if (!$lead && $c->lead_id) {
                $lead = Lead::with('branch')->find($c->lead_id);
            }
            if (!$lead) {
                $lead = Lead::with('branch')->where('phone', 'like', "%{$suffix}")->first();
            }

            $name = $lead ? $lead->name : $c->name;
            $isNoName = empty($name) 
                || strtolower(trim($name)) === 'no name' 
                || strtolower(trim($name)) === '(no name)'
                || str_starts_with($name, '+')
                || str_starts_with($name, 'WA +');

            $displayName = $isNoName ? 'No Name' : $name;
            $contactType = ($lead || $c->lead_id) ? ($isNoName ? 'non-lead' : 'lead') : 'non-lead';

            $lastTime = $c->last_message_at ?? $c->updated_at;
            $formattedTime = '';
            if ($lastTime) {
                $formattedTime = $lastTime->isToday() 
                    ? $lastTime->format('H:i') 
                    : $lastTime->format('d M H:i');
            }

            $branchCodeVal = $lead?->branch?->code ?? $c->branch;

            $allItems->push([
                'id' => 'baileys_contact_' . $c->id,
                'name' => $displayName,
                'is_lead' => !$isNoName && ($lead || $c->lead_id),
                'phone' => $c->phone,
                'type' => $contactType,
                'branch_code' => $branchCodeVal ? strtoupper($branchCodeVal) : null,
                'crm_id' => $lead?->id ?? $c->lead_id,
                'avatar' => null,
                'last_message' => $c->last_message ?: 'Pesan',
                'last_message_time' => $formattedTime ?: date('H:i'),
                'sort_timestamp' => $lastTime ? $lastTime->timestamp : 0,
                'unread_count' => $c->unread_count ?? 0,
                'channel' => 'baileys',
            ]);
        }

        // 2. Read recent WhatsApp chats directly from wa-baileys SQLite session jika ada
        $baseSessionsPath = config('services.whatsapp.sessions_path', dirname(base_path()) . '/wa-baileys/sessions');
        $sessionCandidates = ['solo', 'SOLO', 'smg', 'SMG', 'semarang', 'main', $branchCode];
        $recentBaileys = [];

        foreach (array_unique(array_filter($sessionCandidates)) as $sess) {
            $sqliteFile = rtrim($baseSessionsPath, '/\\') . '/' . $sess . '/database.sqlite';
            if (file_exists($sqliteFile)) {
                try {
                    $pdo = new \PDO("sqlite:" . $sqliteFile);
                    $stmt = $pdo->query("
                        SELECT 
                            m1.jid, 
                            m1.content, 
                            m1.timestamp, 
                            m1.fromMe
                        FROM messages m1
                        INNER JOIN (
                            SELECT jid, MAX(timestamp) as max_ts
                            FROM messages
                            WHERE jid NOT LIKE '%@g.us' AND jid LIKE '%@s.whatsapp.net'
                            GROUP BY jid
                        ) m2 ON m1.jid = m2.jid AND m1.timestamp = m2.max_ts
                        ORDER BY m1.timestamp DESC
                        LIMIT 60
                    ");
                    $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
                    if (!empty($rows)) {
                        $recentBaileys = array_merge($recentBaileys, $rows);
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Could not read Baileys SQLite chats for {$sess}: " . $e->getMessage());
                }
            }
        }

        // Map live chats from Baileys SQLite yang belum ada di whatsapp_contacts
        foreach ($recentBaileys as $msg) {
            $rawPhone = str_replace('@s.whatsapp.net', '', $msg['jid']);
            $digits = preg_replace('/[^0-9]/', '', $rawPhone);
            if (strlen($digits) < 8) continue;

            $suffix = substr($digits, -9);
            if (isset($seenPhones[$suffix])) continue;
            $seenPhones[$suffix] = true;

            $lead = Lead::with('branch')->where('phone', 'like', "%{$suffix}")->first();

            $isNoName = !$lead 
                || empty($lead->name) 
                || strtolower(trim($lead->name)) === 'no name' 
                || strtolower(trim($lead->name)) === '(no name)'
                || str_starts_with($lead->name, '+')
                || str_starts_with($lead->name, 'WA +');

            $displayName = $isNoName ? 'No Name' : $lead->name;
            $contactType = $lead ? ($isNoName ? 'non-lead' : 'lead') : 'non-lead';

            $ts = (int) $msg['timestamp'];
            if ($ts > 9999999999) {
                $ts = (int) ($ts / 1000);
            }
            $formattedTime = date('H:i', $ts);
            if (date('Y-m-d', $ts) !== date('Y-m-d')) {
                $formattedTime = date('d M H:i', $ts);
            }

            $branchCodeVal = $lead?->branch?->code;

            $allItems->push([
                'id' => 'baileys_live_' . $digits,
                'name' => $displayName,
                'is_lead' => !$isNoName,
                'phone' => '+' . $digits,
                'type' => $contactType,
                'branch_code' => $branchCodeVal ? strtoupper($branchCodeVal) : null,
                'crm_id' => $lead?->id,
                'avatar' => null,
                'last_message' => $msg['content'] ?: 'Pesan',
                'last_message_time' => $formattedTime,
                'sort_timestamp' => $ts,
                'unread_count' => 0,
                'channel' => 'baileys',
            ]);
        }

        // 3. Fetch CRM Leads di seluruh cabang yang belum pernah chat
        $leads = Lead::whereNotNull('phone')
            ->where('phone', '!=', '')
            ->with(['branch', 'chatLogs' => function ($q) {
                $q->where('channel', 'baileys')->latest();
            }])
            ->latest('updated_at')
            ->take(60)
            ->get(['id', 'name', 'phone', 'branch_id', 'updated_at', 'created_at']);

        foreach ($leads as $lead) {
            $digits = preg_replace('/[^0-9]/', '', $lead->phone);
            if (strlen($digits) < 8) continue;
            $suffix = substr($digits, -9);
            if (isset($seenPhones[$suffix])) continue;
            $seenPhones[$suffix] = true;

            $latestLog = $lead->chatLogs?->first();
            $lastTime = $latestLog ? $latestLog->created_at : ($lead->updated_at ?? $lead->created_at);
            $formattedTime = $lastTime ? ($lastTime->isToday() ? $lastTime->format('H:i') : $lastTime->format('d M H:i')) : date('H:i');

            $isNoName = empty($lead->name) 
                || strtolower(trim($lead->name)) === 'no name' 
                || strtolower(trim($lead->name)) === '(no name)'
                || str_starts_with($lead->name, '+')
                || str_starts_with($lead->name, 'WA +');

            $displayName = $isNoName ? 'No Name' : $lead->name;
            $contactType = $isNoName ? 'non-lead' : 'lead';
            $branchCodeVal = $lead->branch?->code;

            $allItems->push([
                'id' => 'baileys_lead_' . $lead->id,
                'name' => $displayName,
                'is_lead' => !$isNoName,
                'phone' => $lead->phone,
                'type' => $contactType,
                'branch_code' => $branchCodeVal ? strtoupper($branchCodeVal) : null,
                'crm_id' => $lead->id,
                'avatar' => null,
                'last_message' => $latestLog ? $latestLog->message : 'Belum ada pesan',
                'last_message_time' => $formattedTime,
                'sort_timestamp' => $latestLog ? $latestLog->created_at->timestamp : ($lead->updated_at ? $lead->updated_at->timestamp : 0),
                'unread_count' => 0,
                'channel' => 'baileys',
            ]);
        }

        $contacts = $allItems->sortByDesc('sort_timestamp')->values();

        return response()->json([
            'status' => 'success',
            'branch' => 'all',
            'data' => $contacts,
        ]);
    }

    /**
     * Get chat message history for a specific contact.
     */
    public function getChatHistory(Request $request): JsonResponse
    {
        $phone = $request->query('phone');
        $channel = $request->query('channel', 'official');
        $branch = $request->query('branch', 'solo');

        $cleanPhone = preg_replace('/[^0-9]/', '', (string)$phone);
        $tail = strlen($cleanPhone) >= 8 ? substr($cleanPhone, -8) : $cleanPhone;

        // 1. Coba ambil dari tabel whatsapp_messages
        if (!empty($tail)) {
            $dbMessages = WhatsappMessage::where('phone', 'like', "%{$tail}%")
                ->where('channel', $channel)
                ->orderBy('created_at', 'asc')
                ->get();

            if ($dbMessages->isNotEmpty()) {
                $formatted = $dbMessages->map(function ($msg) {
                    return [
                        'id' => $msg->id,
                        'sender' => $msg->sender, // 'admin' atau 'contact'
                        'text' => $msg->message,
                        'timestamp' => $msg->created_at ? $msg->created_at->format('H:i') : date('H:i'),
                        'status' => $msg->status ?? 'read',
                        'media_url' => $msg->media_url,
                    ];
                })->values();

                return response()->json([
                    'status' => 'success',
                    'channel' => $channel,
                    'phone' => $phone,
                    'messages' => $formatted,
                ]);
            }
        }

        // 2. Fallback untuk Baileys: SQLite database session
        if ($channel === 'baileys') {
            $sessionCandidates = [$branch, 'solo', 'smg', 'semarang', 'main'];
            foreach (array_unique(array_filter($sessionCandidates)) as $candBranch) {
                $sqliteMessages = $this->whatsappService->getHistoryFromSqlite($candBranch, (string)$phone);
                if (!empty($sqliteMessages)) {
                    $formatted = array_map(function ($msg) {
                        $ts = (int) ($msg['timestamp'] ?? 0);
                        if ($ts > 9999999999) {
                            $ts = (int) ($ts / 1000);
                        }
                        return [
                            'id' => $msg['id'] ?? uniqid('msg_'),
                            'sender' => !empty($msg['fromMe']) ? 'admin' : 'contact',
                            'text' => $msg['content'] ?? '',
                            'timestamp' => $ts > 0 ? date('H:i', $ts) : date('H:i'),
                            'status' => 'read',
                            'media_url' => $msg['media_url'] ?? null,
                        ];
                    }, $sqliteMessages);

                    return response()->json([
                        'status' => 'success',
                        'channel' => 'baileys',
                        'phone' => $phone,
                        'messages' => $formatted,
                    ]);
                }
            }

            // Fallback: Baileys HTTP gateway
            try {
                $intlDigits = str_starts_with($cleanPhone, '0') ? '62' . substr($cleanPhone, 1) : $cleanPhone;
                $history = $this->whatsappService->getHistory($branch ?: 'solo', $intlDigits);

                if (isset($history['data']) && is_array($history['data']) && !empty($history['data'])) {
                    $formatted = array_map(function ($msg) {
                        $isAdmin = !empty($msg['fromMe']) || !empty($msg['from_me']);
                        $text = $msg['content'] ?? $msg['body'] ?? $msg['message'] ?? '';
                        $ts = isset($msg['timestamp']) ? (int)$msg['timestamp'] : 0;
                        if ($ts > 9999999999) {
                            $ts = (int) ($ts / 1000);
                        }
                        return [
                            'id' => $msg['id'] ?? uniqid('msg_'),
                            'sender' => $isAdmin ? 'admin' : 'contact',
                            'text' => $text,
                            'timestamp' => $ts > 0 ? date('H:i', $ts) : date('H:i'),
                            'status' => 'read',
                            'media_url' => $msg['media_url'] ?? null,
                        ];
                    }, $history['data']);

                    return response()->json([
                        'status' => 'success',
                        'channel' => 'baileys',
                        'phone' => $phone,
                        'messages' => $formatted,
                    ]);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed fetching Baileys history via HTTP: " . $e->getMessage());
            }
        }

        // 3. Fallback: LeadChatLog untuk pesan lawas
        if (!empty($tail)) {
            $lead = Lead::where('phone', 'LIKE', "%{$tail}%")->first();
            if ($lead) {
                $logsQuery = LeadChatLog::where('lead_id', $lead->id);
                if ($channel === 'official') {
                    $logsQuery->where('channel', 'official');
                }
                $logs = $logsQuery->latest()->get();

                if ($logs->isNotEmpty()) {
                    $formatted = $logs->map(function ($log) use ($channel) {
                        return [
                            'id' => 'log_' . $log->id,
                            'sender' => $log->user_id ? 'admin' : 'contact',
                            'text' => $log->message,
                            'timestamp' => $log->created_at ? $log->created_at->format('H:i') : date('H:i'),
                            'status' => 'read',
                            'template_name' => $log->channel === 'official' ? 'Official Meta' : null,
                        ];
                    })->reverse()->values();

                    return response()->json([
                        'status' => 'success',
                        'channel' => $channel,
                        'phone' => $phone,
                        'messages' => $formatted,
                    ]);
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'channel' => $channel,
            'phone' => $phone,
            'messages' => [],
        ]);
    }

    /**
     * Send official message (Template or Text).
     */
    public function sendOfficialMessage(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string',
            'message' => 'required_without:template_name|nullable|string',
            'template_name' => 'nullable|string',
        ]);

        // Format phone number: convert 08xxx to 628xxx
        $phone = trim($request->phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        $phone = preg_replace('/[^0-9]/', '', $phone);

        $token = env('WA_OFFICIAL_TOKEN');
        $phoneId = env('WA_OFFICIAL_ID'); // Use Phone Number ID (WA_OFFICIAL_ID) instead of display number

        if (!$token || !$phoneId) {
            \Illuminate\Support\Facades\Log::error('WA Official credentials missing in .env');
            return response()->json([
                'status' => 'error',
                'message' => 'Konfigurasi WA_OFFICIAL_TOKEN atau WA_OFFICIAL_ID belum diisi di file .env!',
            ], 422);
        }

        try {
            $url = "https://graph.facebook.com/v19.0/{$phoneId}/messages";
            
            if ($request->template_name) {
                $langCode = $request->input('language_code', 'en_US');
                $payload = [
                    'messaging_product' => 'whatsapp',
                    'to' => $phone,
                    'type' => 'template',
                    'template' => [
                        'name' => $request->template_name,
                        'language' => ['code' => $langCode],
                    ],
                ];
            } else {
                $payload = [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $phone,
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $request->message,
                    ],
                ];
            }

            \Illuminate\Support\Facades\Log::info("WA Official Request Payload:", ['url' => $url, 'payload' => $payload]);

            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => "Bearer {$token}",
                'Content-Type'  => 'application/json',
            ])->post($url, $payload);

            $resBody = $response->json();
            \Illuminate\Support\Facades\Log::info("WA Official Meta Response:", ['status' => $response->status(), 'response' => $resBody]);

            if ($response->failed()) {
                $errorMsg = $resBody['error']['message'] ?? 'Meta API error';
                return response()->json([
                    'status' => 'error',
                    'message' => "Meta WhatsApp API Error: {$errorMsg}",
                    'meta_error' => $resBody,
                ], 400);
            }

            // Update or create WhatsappContact
            $formattedPhone = '+' . $phone;
            $phoneTail = strlen($phone) >= 9 ? substr($phone, -9) : $phone;
            $lead = Lead::where('phone', 'LIKE', "%{$phoneTail}%")->first();
            $displayName = $lead ? $lead->name : 'No Name';
            $sentContent = $request->message ?? ('[Official Template: ' . $request->template_name . ']');

            $contact = WhatsappContact::findByPhone($formattedPhone, 'official');
            if (!$contact) {
                $contact = WhatsappContact::create([
                    'id'              => (string) Str::uuid(),
                    'phone'           => $formattedPhone,
                    'name'            => $displayName,
                    'channel'         => 'official',
                    'branch'          => null,
                    'lead_id'         => $lead?->id,
                    'last_message'    => $sentContent,
                    'last_message_at' => now(),
                    'unread_count'    => 0,
                ]);
            } else {
                $contact->update([
                    'last_message'    => $sentContent,
                    'last_message_at' => now(),
                    'lead_id'         => $lead?->id ?? $contact->lead_id,
                    'name'            => $lead ? $lead->name : $contact->name,
                ]);
            }

            // Save to whatsapp_messages
            WhatsappMessage::create([
                'id'                  => (string) Str::uuid(),
                'whatsapp_contact_id' => $contact->id,
                'lead_id'             => $lead?->id,
                'phone'               => $formattedPhone,
                'branch'              => null,
                'channel'             => 'official',
                'sender'              => 'admin',
                'message'             => $sentContent,
                'status'              => 'sent',
            ]);

            if ($lead) {
                LeadChatLog::create([
                    'lead_id'       => $lead->id,
                    'lead_phase_id' => $lead->lead_phase_id,
                    'user_id'       => auth()->id(),
                    'channel'       => 'official',
                    'message'       => $sentContent,
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pesan berhasil dikirim via WA Official Meta Cloud API!',
                'data' => [
                    'id' => 'msg_' . time(),
                    'sender' => 'admin',
                    'text' => $sentContent,
                    'timestamp' => date('H:i'),
                    'status' => 'sent',
                ],
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("sendOfficialMessage Exception: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available Official Meta Templates directly from Meta Graph API.
     */
    public function getOfficialTemplates(): JsonResponse
    {
        $token = env('WA_OFFICIAL_TOKEN');
        $wabaId = env('WA_OFFICIAL_ID'); // Can be WABA ID or Phone Number ID

        if (!$token || !$wabaId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credentials WA Official belum lengkap.',
                'templates' => [],
            ]);
        }

        try {
            // First attempt: Query message_templates using WABA_ID (or WA_OFFICIAL_NUMBER if WABA ID is configured)
            $url = "https://graph.facebook.com/v19.0/{$wabaId}/message_templates";
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => "Bearer {$token}",
            ])->get($url);

            $resData = $response->json();
            \Illuminate\Support\Facades\Log::info("Meta Message Templates Response:", ['data' => $resData]);

            $parsedTemplates = [];

            if ($response->successful() && isset($resData['data']) && is_array($resData['data'])) {
                foreach ($resData['data'] as $tpl) {
                    $status = strtoupper($tpl['status'] ?? '');
                    if ($status === 'APPROVED' || empty($status)) {
                        $fullText = '';
                        $headerText = '';
                        $bodyText = '';
                        $footerText = '';

                        if (isset($tpl['components']) && is_array($tpl['components'])) {
                            foreach ($tpl['components'] as $comp) {
                                $type = strtoupper($comp['type'] ?? '');
                                if ($type === 'HEADER' && isset($comp['text'])) {
                                    $headerText = "*{$comp['text']}*\n\n";
                                } elseif ($type === 'BODY' && isset($comp['text'])) {
                                    $bodyText = $comp['text'];
                                } elseif ($type === 'FOOTER' && isset($comp['text'])) {
                                    $footerText = "\n\n_{$comp['text']}_";
                                }
                            }
                        }

                        $fullText = trim($headerText . $bodyText . $footerText);

                        $parsedTemplates[] = [
                            'id' => $tpl['id'] ?? $tpl['name'],
                            'name' => $tpl['name'],
                            'language' => $tpl['language'] ?? 'en_US',
                            'category' => $tpl['category'] ?? 'UTILITY',
                            'header' => $tpl['name'],
                            'body' => $fullText ?: "Template: {$tpl['name']}",
                            'variables' => [],
                        ];
                    }
                }
            }

            // Fallback: If no templates returned or endpoint fails, provide default 'hello_world' sample template
            if (empty($parsedTemplates)) {
                $parsedTemplates[] = [
                    'id' => 'tpl_hello_world',
                    'name' => 'hello_world',
                    'language' => 'en_US',
                    'category' => 'UTILITY',
                    'header' => 'Hello World',
                    'body' => 'Welcome and thank you for choosing our service!',
                    'variables' => [],
                ];
            }

            return response()->json([
                'status' => 'success',
                'templates' => $parsedTemplates,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("getOfficialTemplates Exception: " . $e->getMessage());
            return response()->json([
                'status' => 'success',
                'templates' => [
                    [
                        'id' => 'tpl_hello_world',
                        'name' => 'hello_world',
                        'language' => 'en_US',
                        'category' => 'UTILITY',
                        'header' => 'Hello World',
                        'body' => 'Welcome and thank you for choosing our service!',
                        'variables' => [],
                    ]
                ],
            ]);
        }
    }
}
