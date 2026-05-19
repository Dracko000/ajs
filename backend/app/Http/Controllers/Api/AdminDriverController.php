<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Driver;
use App\Models\DriverDocument;

class AdminDriverController extends Controller
{
    /**
     * List all drivers pending verification.
     */
    public function pendingDrivers()
    {
        $drivers = Driver::with(['user', 'documents'])
            ->where('status', 'pending_verification')
            ->get();

        return response()->json($drivers);
    }

    /**
     * Approve or Reject a driver.
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,suspended,rejected',
            'reason' => 'nullable|string'
        ]);

        $driver = Driver::findOrFail($id);
        $driver->update(['status' => $request->status]);

        // If rejected, we might want to notify the user or log the reason
        
        return response()->json([
            'message' => "Status driver berhasil diubah menjadi {$request->status}",
            'driver' => $driver
        ]);
    }

    /**
     * Verify individual document.
     */
    public function verifyDocument(Request $request, $documentId)
    {
        $request->validate([
            'status' => 'required|in:verified,rejected',
            'rejection_reason' => 'nullable|string'
        ]);

        $doc = DriverDocument::findOrFail($documentId);
        $doc->update([
            'status' => $request->status,
            'rejection_reason' => $request->rejection_reason
        ]);

        return response()->json(['message' => 'Status dokumen diperbarui']);
    }
}
