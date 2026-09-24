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
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        $intlPhone = str_starts_with($cleanPhone, '0') ? '62' . substr($cleanPhone, 1) : $cleanPhone;

        try {
            $response = Http::withHeaders([
                'x-api-key' => $this->apiKey,
            ])->timeout(5)->get("{$this->url}/api/chat-history/{$branch}/{$intlPhone}", $params);

            $data = $response->json();

            // Fix: Replace localhost:3000 with the actual server URL for media
            if (isset($data['data']) && is_array($data['data']) && !empty($data['data'])) {
                foreach ($data['data'] as &$msg) {
                    if (isset($msg['media_url']) && str_contains($msg['media_url'], 'localhost:3000')) {
                        $msg['media_url'] = str_replace('http://localhost:3000', $this->url, $msg['media_url']);
                    }
                }
                return $data;
            }
        } catch (\Exception $e) {
            Log::warning("WhatsAppService@getHistory HTTP error: " . $e->getMessage() . " - falling back to SQLite");
        }

        // Fallback to reading directly from Baileys SQLite database
        $sqliteMessages = $this->getHistoryFromSqlite($branch, $phone, (int)($params['limit'] ?? 300));
        if (!empty($sqliteMessages)) {
            return [
                'success' => true,
                'data' => $sqliteMessages,
            ];
        }

        return ['success' => false, 'data' => []];
    }

    /**
     * Read chat history directly from Baileys SQLite session database.
     */
    public function getHistoryFromSqlite(string $branch, string $phone, int $limit = 300): array
    {
        $digits = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($digits) < 6) {
            return [];
        }

        $intlDigits = str_starts_with($digits, '0') ? '62' . substr($digits, 1) : $digits;
        $suffix = strlen($digits) >= 8 ? substr($digits, -8) : $digits;

        $baseSessionsPath = config('services.whatsapp.sessions_path', dirname(base_path()) . '/wa-baileys/sessions');
        $candidates = [
            rtrim($baseSessionsPath, '/\\') . '/' . strtolower($branch) . '/database.sqlite',
            rtrim($baseSessionsPath, '/\\') . '/' . strtoupper($branch) . '/database.sqlite',
            rtrim($baseSessionsPath, '/\\') . '/' . $branch . '/database.sqlite',
        ];

        $sessionDir = null;
        foreach ($candidates as $cand) {
            if (file_exists($cand)) {
                $sessionDir = $cand;
                break;
            }
        }

        if (!$sessionDir) {
            return [];
        }

        try {
            $pdo = new \PDO("sqlite:" . $sessionDir);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            $stmt = $pdo->prepare("
                SELECT id, jid, fromMe, content, timestamp, media_url
                FROM messages
                WHERE jid NOT LIKE '%@g.us'
                  AND (
                    jid = :jid1
                    OR jid = :jid2
                    OR jid LIKE :pattern
                  )
                ORDER BY timestamp ASC
                LIMIT :limit
            ");

            $stmt->bindValue(':jid1', "{$intlDigits}@s.whatsapp.net", \PDO::PARAM_STR);
            $stmt->bindValue(':jid2', "{$digits}@s.whatsapp.net", \PDO::PARAM_STR);
            $stmt->bindValue(':pattern', "%{$suffix}@s.whatsapp.net", \PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->execute();

            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // Normalize fields
            foreach ($rows as &$msg) {
                if (isset($msg['media_url']) && str_contains($msg['media_url'], 'localhost:3000')) {
                    $msg['media_url'] = str_replace('http://localhost:3000', $this->url, $msg['media_url']);
                }
            }

            return $rows;
        } catch (\Throwable $e) {
            Log::warning("WhatsAppService::getHistoryFromSqlite error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Send a text message to a lead.
     */
    public function sendMessage(string $branch, string $phone, string $message)
    {
        $branch = strtolower($branch);
        try {
            // Anti-Spam / Anti-Ban: Ensure human-like delay (minimum 2.5 - 3.5 seconds) between consecutive sends on the same branch
            $cacheKey = "wa_last_sent_{$branch}";
            $lastSentMicro = \Illuminate\Support\Facades\Cache::get($cacheKey);
            $nowMicro = microtime(true);

            if ($lastSentMicro) {
                $elapsed = $nowMicro - (float)$lastSentMicro;
                $minInterval = 2.5; // Minimum 2.5 seconds gap per message to protect WhatsApp number
                if ($elapsed < $minInterval) {
                    $delayMicro = (int)(($minInterval - $elapsed) * 1000000);
                    usleep($delayMicro);
                }
            }
            \Illuminate\Support\Facades\Cache::put($cacheKey, microtime(true), now()->addMinutes(2));

            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
            $intlPhone = str_starts_with($cleanPhone, '0') ? '62' . substr($cleanPhone, 1) : $cleanPhone;

            $payload = [
                'branch'  => $branch,
                'phone'   => $intlPhone,
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
