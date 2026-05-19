<?php

namespace App\Events;

use App\Models\DriverManifest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TripStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $manifestId;
    public $studentName;
    public $status;
    public $type;
    public $parentId;

    /**
     * Create a new event instance.
     */
    public function __construct(DriverManifest $manifest)
    {
        $this->manifestId = $manifest->id;
        $this->studentName = $manifest->student->name;
        $this->status = $manifest->status; // picked_up, arrived, absent
        $this->type = $manifest->type; // pickup, dropoff
        $this->parentId = $manifest->student->parent_id;
    }

    /**
     * Broadcast on a channel specific to the parent's user ID.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->parentId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'trip.updated';
    }
}
