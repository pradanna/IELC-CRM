<?php

namespace App\Events;

use App\Domains\CRM\Domain\Models\Lead;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WhatsappMessageReceived implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ?Lead $lead;
    public $message;
    public $channelName;
    public ?string $phone;
    public ?string $name;

    /**
     * Create a new event instance.
     */
    public function __construct(?Lead $lead, string $message, string $channelName = 'official', ?string $phone = null, ?string $name = null)
    {
        $this->lead = $lead;
        $this->message = $message;
        $this->channelName = $channelName;
        $this->phone = $phone ?? $lead?->phone;
        $this->name = $name ?? $lead?->name;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('whatsapp-messages'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.received';
    }

    /**
     * Data to broadcast with the event.
     */
    public function broadcastWith(): array
    {
        if ($this->lead) {
            $isNoName = empty($this->lead->name) 
                || strtolower(trim($this->lead->name)) === 'no name' 
                || strtolower(trim($this->lead->name)) === '(no name)'
                || str_starts_with($this->lead->name, '+')
                || str_starts_with($this->lead->name, 'WA +');

            $displayName = $isNoName ? 'No Name' : $this->lead->name;
            $phone = $this->lead->phone;
            $isLead = !$isNoName;
        } else {
            $displayName = $this->name ?? 'No Name';
            $phone = $this->phone ?? '';
            $isLead = false;
        }

        return [
            'lead_id' => $this->lead?->id,
            'name' => $displayName,
            'phone' => $phone,
            'is_lead' => $isLead,
            'message' => $this->message,
            'channel' => $this->channelName,
            'time' => now()->format('H:i'),
            'timestamp' => now()->timestamp,
            'lead' => $this->lead ? [
                'id' => $this->lead->id,
                'name' => $displayName,
                'phone' => $this->lead->phone,
                'branch_id' => $this->lead->branch_id,
            ] : null,
        ];
    }
}
