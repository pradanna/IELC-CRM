<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class WhatsAppController extends Controller
{
    protected WhatsAppService $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    /**
     * Display the WhatsApp Management page.
     */
    public function index(): \Inertia\Response
    {
        return \Inertia\Inertia::render('Admin/Crm/Whatsapp/Index', [
            'branches' => \App\Domains\Master\Domain\Models\Branch::all(['id', 'name', 'code']),
        ]);
    }

    /**
     * Proxy status check.
     */
    public function getStatus(string $branch): JsonResponse
    {
        $status = $this->whatsapp->getStatus($branch);
        return response()->json($status);
    }

    /**
     * Proxy history check.
     */
    public function getHistory(string $branch, string $phone, Request $request): JsonResponse
    {
        $history = $this->whatsapp->getHistory($branch, $phone, $request->all());
        return response()->json($history);
    }

    /**
     * Proxy send message.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'branch' => 'required|string',
            'phone' => 'required|string',
            'message' => 'required|string',
        ]);

        $result = $this->whatsapp->sendMessage(
            $request->branch,
            $request->phone,
            $request->message
        );

        if ($result['success'] ?? false) {
            try {
                $cleanPhone = preg_replace('/[^0-9]/', '', $request->phone);
                $phoneTail = substr($cleanPhone, -9);
                $lead = \App\Domains\CRM\Domain\Models\Lead::where('phone', 'like', "%{$phoneTail}%")->first();
                if ($lead) {
                    \App\Domains\CRM\Domain\Models\LeadChatLog::create([
                        'lead_id'       => $lead->id,
                        'lead_phase_id' => $lead->lead_phase_id,
                        'user_id'       => auth()->id(),
                        'message'       => $request->message,
                    ]);
                    \App\Domains\CRM\Domain\Models\LeadActivity::create([
                        'lead_id'     => $lead->id,
                        'user_id'     => auth()->id(),
                        'type'        => 'message',
                        'description' => $request->message,
                    ]);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Could not log sent message to LeadChatLog: " . $e->getMessage());
            }
        }

        return response()->json($result);
    }
    /**
     * Logout WhatsApp session.
     */
    public function logout(string $branch): JsonResponse
    {
        $result = $this->whatsapp->logout($branch);
        return response()->json($result);
    }
}


