<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * The authenticated user's own notifications only -- these span every
     * tenant they've ordered/booked with or work for, not just the one in
     * the current request (this endpoint isn't tenant-scoped at all).
     */
    public function index(Request $request)
    {
        return [
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'notifications' => $request->user()->notifications()->limit(50)->get(),
        ];
    }

    /**
     * Mark the specified resource as read.
     */
    public function markRead(Request $request)
    {
        $notification = $request->user()->notifications()
            ->findOrFail((string) $request->route('notification'));

        $notification->markAsRead();

        return $notification;
    }

    /**
     * Mark every unread notification as read.
     */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->noContent();
    }
}
