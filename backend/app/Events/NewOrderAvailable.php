<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderAvailable implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $targetUserId;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order, $targetUserId = null)
    {
        $this->order = $order;
        $this->targetUserId = $targetUserId;
    }

    /**
     * Broadcast to specific driver or general channel.
     */
    public function broadcastOn(): array
    {
        if ($this->targetUserId) {
            return [new PrivateChannel('App.Models.User.' . $this->targetUserId)];
        }
        return [new Channel('drivers')];
    }

    public function broadcastAs(): string
    {
        return 'order.new';
    }
}
