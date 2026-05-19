<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Driver;
use App\Models\DriverDocument;
use Illuminate\Support\Facades\DB;

class DriverRegistrationController extends Controller
{
    /**
     * Submit driver basic info and vehicle data.
     */
    public function register(Request $request)
    {
        $request->validate([
            'nik' => 'required|string|size:16',
            'license_number' => 'required|string',
            'vehicle_number' => 'required|string',
            'vehicle_model' => 'required|string',
            'bank_name' => 'required|string',
            'bank_account_number' => 'required|string',
        ]);

        $user = $request->user();

        $driver = Driver::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nik' => $request->nik,
                'license_number' => $request->license_number,
                'vehicle_number' => $request->vehicle_number,
                'vehicle_model' => $request->vehicle_model,
                'bank_name' => $request->bank_name,
                'bank_account_number' => $request->bank_account_number,
                'status' => 'pending_verification'
            ]
        );

        return response()->json(['message' => 'Data dasar berhasil disimpan', 'driver' => $driver]);
    }

    /**
     * Upload driver documents (KTP, SIM, SKCK, etc.)
     */
    public function uploadDocument(Request $request)
    {
        $request->validate([
            'type' => 'required|in:ktp,sim,stnk,skck,photo',
            'file' => 'required|image|max:2048', // Max 2MB
        ]);

        $driver = $request->user()->driver;
        if (!$driver) {
            return response()->json(['message' => 'Lengkapi data dasar terlebih dahulu'], 400);
        }

        $path = $request->file('file')->store('driver_docs/' . $driver->id, 'public');

        $document = DriverDocument::updateOrCreate(
            ['driver_id' => $driver->id, 'type' => $request->type],
            ['file_path' => $path, 'status' => 'pending']
        );

        return response()->json(['message' => 'Dokumen berhasil diunggah', 'document' => $document]);
    }

    /**
     * Get current registration status.
     */
    public function status(Request $request)
    {
        $driver = $request->user()->driver;
        if (!$driver) return response()->json(['registered' => false]);

        return response()->json([
            'registered' => true,
            'status' => $driver->status,
            'documents' => $driver->documents()->get(['type', 'status', 'rejection_reason'])
        ]);
    }
}
