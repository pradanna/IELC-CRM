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

    public $lead;
    public $message;
    public $channelName;

    /**
     * Create a new event instance.
     */
    public function __construct(Lead $lead, string $message, string $channelName = 'official')
    {
        $this->lead = $lead;
        $this->message = $message;
        $this->channelName = $channelName;
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
        $isNoName = empty($this->lead->name) 
            || strtolower(trim($this->lead->name)) === 'no name' 
            || strtolower(trim($this->lead->name)) === '(no name)'
            || str_starts_with($this->lead->name, '+')
            || str_starts_with($this->lead->name, 'WA +');

        $displayName = $isNoName ? 'No Name' : $this->lead->name;

        return [
            'lead_id' => $this->lead->id,
            'name' => $displayName,
            'phone' => $this->lead->phone,
            'is_lead' => !$isNoName,
            'message' => $this->message,
            'channel' => $this->channelName,
            'time' => now()->format('H:i'),
            'timestamp' => now()->timestamp,
            'lead' => [
                'id' => $this->lead->id,
                'name' => $displayName,
                'phone' => $this->lead->phone,
                'branch_id' => $this->lead->branch_id,
            ],
        ];
    }
}
