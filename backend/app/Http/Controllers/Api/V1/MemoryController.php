<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MemoryController extends Controller
{
    /**
     * Get entries from exactly 1, 2, 3+ years ago on the user's current day.
     */
    public function onThisDay(Request $request): JsonResponse
    {
        // Default to UTC if the frontend doesn't provide a timezone
        $timezone = $request->header('X-Timezone', 'UTC');
        
        try {
            $today = Carbon::now($timezone);
        } catch (\Exception $e) {
            // Fallback to UTC if timezone string is invalid
            $today = Carbon::now('UTC');
        }

        $entries = $request->user()->journalEntries()
            ->with(['mood', 'tags'])
            ->whereMonth('entry_date', $today->month)
            ->whereDay('entry_date', $today->day)
            ->whereYear('entry_date', '<', $today->year)
            ->orderBy('entry_date', 'desc')
            ->get();

        return response()->json($entries);
    }
}
