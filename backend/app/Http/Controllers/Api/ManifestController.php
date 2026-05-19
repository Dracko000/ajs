<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DriverManifest;
use App\Models\Student;
use App\Models\Driver;
use Carbon\Carbon;

class ManifestController extends Controller
{
    /**
     * Driver: Get my schedule for today.
     */
    public function myManifest(Request $request)
    {
        $driver = $request->user()->driver;
        if (!$driver) return response()->json([], 404);

        $dayOfWeek = Carbon::now()->dayOfWeek; // 0 (Sun) - 6 (Sat)
        // Convert to 1-5 for school days if needed, but let's just use current day.
        
        $manifests = DriverManifest::with('student.school')
            ->where('driver_id', $driver->id)
            ->orderBy('scheduled_at')
            ->get();

        return response()->json($manifests);
    }

    /**
     * Driver: Update student pickup/dropoff status.
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:picked_up,arrived,absent'
        ]);

        $manifest = DriverManifest::with('student')->findOrFail($id);
        $manifest->update(['status' => $request->status]);

        // Trigger Event for Real-time Notification to Parent
        broadcast(new \App\Events\TripStatusUpdated($manifest))->toOthers();

        return response()->json(['message' => 'Status berhasil diperbarui', 'manifest' => $manifest]);
    }

    /**
     * Admin: Assign driver to a student.
     */
    public function assign(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'driver_id' => 'required|exists:drivers,id',
            'scheduled_at' => 'required',
            'type' => 'required|in:pickup,dropoff',
            'day_of_week' => 'required|integer|min:1|max:7'
        ]);

        $manifest = DriverManifest::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'type' => $request->type,
                'day_of_week' => $request->day_of_week
            ],
            [
                'driver_id' => $request->driver_id,
                'scheduled_at' => $request->scheduled_at,
                'status' => 'scheduled'
            ]
        );

        return response()->json(['message' => 'Penugasan berhasil', 'manifest' => $manifest]);
    }

    /**
     * Admin: Get all students and their assigned drivers.
     */
    public function allAssignments()
    {
        $students = Student::with(['school', 'manifests.driver.user'])->get();
        return response()->json($students);
    }
}
