<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class JournalEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $entries = $request->user()->journalEntries()
            ->with('mood')
            ->orderBy('entry_date', 'desc')
            ->paginate(15);

        return response()->json($entries);
    }

    /**
     * Get a lightweight list of entry dates and moods for the calendar component.
     */
    public function calendar(Request $request): JsonResponse
    {
        $month = $request->query('month', Carbon::now()->format('Y-m'));
        $start = Carbon::parse($month . '-01')->startOfMonth()->toDateString();
        $end = Carbon::parse($month . '-01')->endOfMonth()->toDateString();

        $entries = $request->user()->journalEntries()
            ->with('mood:id,emoji,label,value')
            ->whereBetween('entry_date', [$start, $end])
            ->get(['id', 'entry_date', 'mood_id'])
            ->mapWithKeys(function ($entry) {
                return [
                    $entry->entry_date->toDateString() => [
                        'id' => $entry->id,
                        'mood' => $entry->mood,
                    ],
                ];
            });

        return response()->json($entries);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mood_id' => ['required', 'exists:moods,id'],
            'entry_date' => ['required', 'date', 'before_or_equal:today'],
            'content' => ['required', 'string'],
        ]);

        // Enforce one per day limit
        $date = Carbon::parse($data['entry_date'])->toDateString();

        $existing = $request->user()->journalEntries()
            ->where('entry_date', $date)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'An entry already exists for this date.',
            ], 422);
        }

        $entry = $request->user()->journalEntries()->create([
            'mood_id' => $data['mood_id'],
            'entry_date' => $date,
            'content' => $data['content'],
        ]);

        return response()->json($entry->load('mood'), 201);
    }

    /**
     * Display the specified resource by date.
     */
    public function show(Request $request, string $date): JsonResponse
    {
        $entry = $request->user()->journalEntries()
            ->with('mood')
            ->where('entry_date', $date)
            ->firstOrFail();

        return response()->json($entry);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $date): JsonResponse
    {
        $entry = $request->user()->journalEntries()
            ->where('entry_date', $date)
            ->firstOrFail();

        $data = $request->validate([
            'mood_id' => ['sometimes', 'exists:moods,id'],
            'content' => ['sometimes', 'string'],
        ]);

        $entry->update($data);

        return response()->json($entry->load('mood'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $date): JsonResponse
    {
        $entry = $request->user()->journalEntries()
            ->where('entry_date', $date)
            ->firstOrFail();

        $entry->delete();

        return response()->json(null, 204);
    }
}
