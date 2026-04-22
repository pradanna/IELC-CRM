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

            $data = $response->json();

            // Fix: Replace localhost:3000 for QR Code
            if (isset($data['qr_image_url']) && str_contains($data['qr_image_url'], 'localhost:3000')) {
                $data['qr_image_url'] = str_replace('http://localhost:3000', $this->url, $data['qr_image_url']);
            }

            return $data;
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

            $data = $response->json();

            // Fix: Replace localhost:3000 with the actual server URL for media
            if (isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as &$msg) {
                    if (isset($msg['media_url']) && str_contains($msg['media_url'], 'localhost:3000')) {
                        $msg['media_url'] = str_replace('http://localhost:3000', $this->url, $msg['media_url']);
                    }
                }
            }

            return $data;
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

    /**
     * Logout and delete session data for a specific branch.
     */
    public function logout(string $branch)
    {
        $branch = strtolower($branch);
        try {
            $response = Http::withHeaders([ 
                'x-api-key' => $this->apiKey,
            ])->delete("{$this->url}/api/wa-status/{$branch}");

            return $response->json();
        } catch (\Exception $e) {
            Log::error("WhatsAppService@logout error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
