<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Http\Controllers\Controller;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Crm\Domain\Models\Lead;
use App\Domains\Academic\Domain\Models\Student;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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

        return Inertia::render('Admin/Crm/Whatsapp/Inbox', [
            'branches' => $branches,
            'officialPhone' => config('services.whatsapp_official.number', env('WA_OFFICIAL_NUMBER', '-')),
            'officialStatus' => env('WA_OFFICIAL_TOKEN') ? 'connected' : 'disconnected',
        ]);
    }

    /**
     * Get conversation contact list for WA Official.
     */
    public function getOfficialConversations(Request $request): JsonResponse
    {
        $leads = Lead::whereNotNull('phone')
            ->where('phone', '!=', '')
            ->with(['chatLogs' => function ($query) {
                $query->where('channel', 'official')->latest();
            }])
            ->latest('updated_at')
            ->get(['id', 'name', 'phone', 'lead_phase_id', 'updated_at', 'created_at']);

        // Filter contacts that have valid WhatsApp phone number (minimum 8 digits)
        $validLeads = $leads->filter(function ($lead) {
            $digits = preg_replace('/[^0-9]/', '', $lead->phone);
            return strlen($digits) >= 8;
        });

        $contacts = $validLeads->map(function ($lead) {
            $latestLog = $lead->chatLogs->first();
            $lastTime = $latestLog ? $latestLog->created_at : ($lead->updated_at ?? $lead->created_at);
            
            $formattedTime = '';
            if ($lastTime) {
                $formattedTime = $lastTime->isToday() 
                    ? $lastTime->format('H:i') 
                    : $lastTime->format('d M H:i');
            }

            return [
                'id' => 'official_' . $lead->id,
                'name' => $lead->name ?? 'Lead #' . $lead->id,
                'phone' => $lead->phone,
                'type' => 'lead',
                'crm_id' => $lead->id,
                'avatar' => null,
                'last_message' => $latestLog ? $latestLog->message : 'Kontak WhatsApp CRM',
                'last_message_time' => $formattedTime ?: date('H:i'),
                'sort_timestamp' => $lastTime ? $lastTime->timestamp : 0,
                'unread_count' => 0,
                'channel' => 'official',
            ];
        })
        ->sortByDesc('sort_timestamp')
        ->values();

        return response()->json([
            'status' => 'success',
            'data' => $contacts,
        ]);
    }

    /**
     * Get conversation contact list for WA Baileys per branch.
     */
    public function getBaileysConversations(string $branchCode, Request $request): JsonResponse
    {
        $branch = Branch::where('code', strtolower($branchCode))
            ->orWhere('code', strtoupper($branchCode))
            ->first();

        // 1. Fetch Students with WhatsApp phone
        $studentsQuery = Student::whereNotNull('phone')
            ->where('phone', '!=', '');

        if ($branch) {
            $studentsQuery->whereHas('lead', function ($q) use ($branch) {
                $q->where('branch_id', $branch->id);
            });
        }

        $students = $studentsQuery->with(['lead.chatLogs' => function ($q) {
            $q->where('channel', 'baileys')->latest();
        }])->get(['id', 'lead_id', 'name', 'phone', 'status', 'updated_at', 'created_at']);

        // 2. Fetch Leads with WhatsApp phone for this branch
        $leadsQuery = Lead::whereNotNull('phone')
            ->where('phone', '!=', '');

        if ($branch) {
            $leadsQuery->where('branch_id', $branch->id);
        }

        $leads = $leadsQuery->with(['chatLogs' => function ($q) {
            $q->where('channel', 'baileys')->latest();
        }])->get(['id', 'name', 'phone', 'updated_at', 'created_at']);

        // Combine and filter valid WhatsApp numbers (minimum 8 digits)
        $allItems = collect();

        foreach ($students as $student) {
            $digits = preg_replace('/[^0-9]/', '', $student->phone);
            if (strlen($digits) >= 8) {
                $latestLog = $student->lead?->chatLogs?->first();
                $lastTime = $latestLog ? $latestLog->created_at : ($student->updated_at ?? $student->created_at);

                $formattedTime = $lastTime ? ($lastTime->isToday() ? $lastTime->format('H:i') : $lastTime->format('d M H:i')) : date('H:i');

                $allItems->push([
                    'id' => 'baileys_stu_' . $student->id,
                    'name' => $student->name ?? 'Student #' . $student->id,
                    'phone' => $student->phone,
                    'type' => 'student',
                    'crm_id' => $student->id,
                    'avatar' => null,
                    'last_message' => $latestLog ? $latestLog->message : 'Siswa Aktif WhatsApp',
                    'last_message_time' => $formattedTime,
                    'sort_timestamp' => $lastTime ? $lastTime->timestamp : 0,
                    'unread_count' => 0,
                    'channel' => 'baileys',
                ]);
            }
        }

        foreach ($leads as $lead) {
            $digits = preg_replace('/[^0-9]/', '', $lead->phone);
            if (strlen($digits) >= 8) {
                $latestLog = $lead->chatLogs?->first();
                $lastTime = $latestLog ? $latestLog->created_at : ($lead->updated_at ?? $lead->created_at);

                $formattedTime = $lastTime ? ($lastTime->isToday() ? $lastTime->format('H:i') : $lastTime->format('d M H:i')) : date('H:i');

                $allItems->push([
                    'id' => 'baileys_lead_' . $lead->id,
                    'name' => $lead->name ?? 'Lead #' . $lead->id,
                    'phone' => $lead->phone,
                    'type' => 'lead',
                    'crm_id' => $lead->id,
                    'avatar' => null,
                    'last_message' => $latestLog ? $latestLog->message : 'Lead Baru WhatsApp',
                    'last_message_time' => $formattedTime,
                    'sort_timestamp' => $lastTime ? $lastTime->timestamp : 0,
                    'unread_count' => 0,
                    'channel' => 'baileys',
                ]);
            }
        }

        // Sort descending by sort_timestamp (newest first)
        $contacts = $allItems->sortByDesc('sort_timestamp')->values();

        return response()->json([
            'status' => 'success',
            'branch' => $branchCode,
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

        if ($channel === 'baileys') {
            try {
                $history = $this->whatsappService->getHistory($branch, $phone);
                if (isset($history['data']) && is_array($history['data'])) {
                    $formatted = array_map(function ($msg) {
                        return [
                            'id' => $msg['id'] ?? uniqid('msg_'),
                            'sender' => ($msg['from_me'] ?? false) ? 'admin' : 'contact',
                            'text' => $msg['body'] ?? $msg['message'] ?? '',
                            'timestamp' => isset($msg['timestamp']) ? date('H:i', $msg['timestamp']) : date('H:i'),
                            'status' => 'read',
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
                \Illuminate\Support\Facades\Log::error("Failed fetching Baileys history: " . $e->getMessage());
            }
        }

        // Retrieve persisted database logs for Official channel
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '62')) {
            $cleanPhone = substr($cleanPhone, 2);
        } elseif (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = substr($cleanPhone, 1);
        }

        $lead = Lead::where('phone', 'LIKE', "%{$cleanPhone}%")->first();
        if ($lead) {
            $logs = \App\Domains\CRM\Domain\Models\LeadChatLog::where('lead_id', $lead->id)
                ->where('channel', $channel)
                ->latest()
                ->get();

            $formatted = $logs->map(function ($log) use ($channel) {
                return [
                    'id' => 'log_' . $log->id,
                    'sender' => $log->user_id ? 'admin' : 'contact',
                    'text' => $log->message,
                    'timestamp' => $log->created_at ? $log->created_at->format('H:i') : date('H:i'),
                    'status' => 'read',
                    'template_name' => $channel === 'official' ? 'Official Meta' : null,
                ];
            })->reverse()->values();

            return response()->json([
                'status' => 'success',
                'channel' => 'official',
                'phone' => $phone,
                'messages' => $formatted,
            ]);
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

            // Find lead by phone number to associate chat log
            $cleanPhone = substr($phone, 2); // remove 62
            $lead = Lead::where('phone', 'LIKE', "%{$cleanPhone}%")->first();
            if ($lead) {
                \App\Domains\CRM\Domain\Models\LeadChatLog::create([
                    'lead_id'       => $lead->id,
                    'lead_phase_id' => $lead->lead_phase_id,
                    'user_id'       => auth()->id(),
                    'channel'       => 'official',
                    'message'       => $request->message ?? ('[Official Template: ' . $request->template_name . ']'),
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pesan berhasil dikirim via WA Official Meta Cloud API!',
                'data' => [
                    'id' => 'msg_' . time(),
                    'sender' => 'admin',
                    'text' => $request->message ?? ('[Template: ' . $request->template_name . ']'),
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
