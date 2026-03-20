<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrashController extends Controller
{
    /**
     * List all soft-deleted entries for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $entries = JournalEntry::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->with('mood')
            ->orderByDesc('deleted_at')
            ->get();

        return response()->json($entries);
    }

    /**
     * Restore a soft-deleted entry by its date.
     * Returns 409 if a live entry already exists for that date.
     */
    public function restore(Request $request, string $date): JsonResponse
    {
        $entry = JournalEntry::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->where('entry_date', $date)
            ->firstOrFail();

        // Check if a live (non-trashed) entry already occupies this date
        $conflict = JournalEntry::where('user_id', $request->user()->id)
            ->where('entry_date', $date)
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Cannot restore: an entry already exists for this date.',
            ], 409);
        }

        $entry->restore();

        return response()->json($entry->load('mood'));
    }

    /**
     * Permanently delete a soft-deleted entry.
     */
    public function forceDestroy(Request $request, string $date): JsonResponse
    {
        $entry = JournalEntry::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->where('entry_date', $date)
            ->firstOrFail();

        $entry->forceDelete();

        return response()->json(null, 204);
    }
}
