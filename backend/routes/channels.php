<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    $order = \App\Models\Order::find($orderId);
    if (!$order) return false;
    return $user->id === $order->user_id || ($user->driver && $user->driver->id === $order->driver_id);
});

Broadcast::channel('drivers', function ($user) {
    return $user !== null;
});

Broadcast::channel('tracking.{parentId}', function ($user, $parentId) {
    return (int) $user->id === (int) $parentId;
});
