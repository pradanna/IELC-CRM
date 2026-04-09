<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $url;
    protected string $apiKey;

    public function __construct()
    {
        $this->url = config('services.whatsapp.url');
        $this->apiKey = config('services.whatsapp.api_key');
    }

    /**
     * Check status and get QR code if needed.
     */
    public function getStatus(string $branch)
    {
        $branch = strtolower($branch);
        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
            ])->get("{$this->url}/api/wa-status/{$branch}");

            return $response->json();
        } catch (\Exception $e) {
            Log::error("WhatsAppService@getStatus error: " . $e->getMessage());
            return ['success' => false, 'status' => 'disconnected', 'error' => $e->getMessage()];
        }
    }

    /**
     * Get chat history for a specific phone number.
     */
    public function getHistory(string $branch, string $phone, array $params = [])
    {
        $branch = strtolower($branch);
        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
            ])->get("{$this->url}/api/chat-history/{$branch}/{$phone}", $params);

            return $response->json();
        } catch (\Exception $e) {
            Log::error("WhatsAppService@getHistory error: " . $e->getMessage());
            return ['success' => false, 'data' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * Send a text message to a lead.
     */
    public function sendMessage(string $branch, string $phone, string $message)
    {
        $branch = strtolower($branch);
        try {
            $payload = [
                'branch'  => $branch,
                'phone'   => $phone,
                'message' => $message,
            ];

            Log::info("WhatsAppService: Sending message to Gateway", [
                'url'     => "{$this->url}/api/send-message",
                'payload' => $payload
            ]);

            $response = Http::withHeaders([
                'x-api-key'    => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->url}/api/send-message", $payload);

            $result = $response->json();

            Log::info("WhatsAppService: Gateway Response", [
                'status' => $response->status(),
                'body'   => $result
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error("WhatsAppService@sendMessage error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
