<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JournalEntryController extends Controller
{
    /** Display a listing of entries, optionally filtered by tag IDs. */
    public function index(Request $request): JsonResponse
    {
        $sort  = in_array(strtolower($request->query('sort')), ['asc', 'desc']) ? $request->query('sort') : 'desc';
        $query = $request->user()->journalEntries()
            ->with(['mood', 'tags'])
            ->orderBy('entry_date', $sort);

        // Optional: filter by one or more tag IDs (OR logic by default)
        if ($request->filled('tags')) {
            $tagIds = (array) $request->query('tags');
            $mode   = $request->query('tags_mode', 'OR');

            if (strtoupper($mode) === 'AND') {
                foreach ($tagIds as $tagId) {
                    $query->whereHas('tags', fn ($q) => $q->where('tags.id', $tagId));
                }
            } else {
                $query->whereHas('tags', fn ($q) => $q->whereIn('tags.id', $tagIds));
            }
        }

        $perPage = $request->query('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    /** Get a lightweight list of entry dates and moods for the calendar component. */
    public function calendar(Request $request): JsonResponse
    {
        $month = $request->query('month', Carbon::now()->format('Y-m'));
        $start = Carbon::parse($month . '-01')->startOfMonth()->toDateString();
        $end   = Carbon::parse($month . '-01')->endOfMonth()->toDateString();

        $entries = $request->user()->journalEntries()
            ->with('mood:id,emoji,label,value')
            ->whereBetween('entry_date', [$start, $end])
            ->get(['id', 'entry_date', 'mood_id'])
            ->mapWithKeys(function ($entry) {
                return [
                    $entry->entry_date->toDateString() => [
                        'id'   => $entry->id,
                        'mood' => $entry->mood,
                    ],
                ];
            });

        return response()->json($entries);
    }

    /** Store a newly created entry (optionally with tag IDs). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mood_id'          => ['required', 'exists:moods,id'],
            'entry_date'       => ['required', 'date', 'before_or_equal:tomorrow'],
            'title'            => ['sometimes', 'nullable', 'string', 'max:255'],
            'content'          => ['required', 'string'],
            'tag_ids'          => ['sometimes', 'array'],
            'tag_ids.*'        => ['integer', 'exists:tags,id'],
            'cover_image_url'  => ['sometimes', 'nullable', 'url', 'max:2048'],
            'cover_image_caption' => ['sometimes', 'nullable', 'string', 'max:255'],
            'images_to_delete' => ['sometimes', 'array'],
            'images_to_delete.*' => ['string'],
        ]);

        $date = Carbon::parse($data['entry_date'])->toDateString();

        $existing = $request->user()->journalEntries()
            ->where('entry_date', $date)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'An entry already exists for this date.'], 422);
        }

        $entry = $request->user()->journalEntries()->create([
            'mood_id'    => $data['mood_id'],
            'entry_date' => $date,
            'title'      => $data['title'] ?? null,
            'content'    => $data['content'],
            'cover_image_url' => $data['cover_image_url'] ?? null,
            'cover_image_caption' => $data['cover_image_caption'] ?? null,
        ]);

        // Sync tags if provided (validates they belong to this user)
        if (!empty($data['tag_ids'])) {
            $validTagIds = $request->user()->tags()
                ->whereIn('id', $data['tag_ids'])
                ->pluck('id');
            $entry->tags()->sync($validTagIds);
        }

        // Destroy any removed Cloudinary images
        $this->deleteCloudinaryImages($data['images_to_delete'] ?? []);

        return response()->json($entry->load(['mood', 'tags']), 201);
    }

    /** Display the specified resource by date. */
    public function show(Request $request, string $date): JsonResponse
    {
        $entry = $request->user()->journalEntries()
            ->with(['mood', 'tags'])
            ->where('entry_date', $date)
            ->firstOrFail();

        return response()->json($entry);
    }

    /** Update an existing entry (optionally sync tags). */
    public function update(Request $request, string $date): JsonResponse
    {
        $entry = $request->user()->journalEntries()
            ->where('entry_date', $date)
            ->firstOrFail();

        $data = $request->validate([
            'mood_id'            => ['sometimes', 'exists:moods,id'],
            'title'              => ['sometimes', 'nullable', 'string', 'max:255'],
            'content'            => ['sometimes', 'string'],
            'tag_ids'            => ['sometimes', 'array'],
            'tag_ids.*'          => ['integer', 'exists:tags,id'],
            'cover_image_url'    => ['sometimes', 'nullable', 'url', 'max:2048'],
            'cover_image_caption' => ['sometimes', 'nullable', 'string', 'max:255'],
            'images_to_delete'   => ['sometimes', 'array'],
            'images_to_delete.*' => ['string'],
        ]);

        $entry->update($request->only([
            'mood_id', 'title', 'content', 'cover_image_url', 'cover_image_caption'
        ]));

        if (array_key_exists('tag_ids', $data)) {
            $validTagIds = $request->user()->tags()
                ->whereIn('id', $data['tag_ids'])
                ->pluck('id');
            $entry->tags()->sync($validTagIds);
        }

        // Destroy any removed Cloudinary images
        $this->deleteCloudinaryImages($data['images_to_delete'] ?? []);

        return response()->json($entry->load(['mood', 'tags']));
    }

    /** Remove the specified resource from storage (soft delete). */
    public function destroy(Request $request, string $date): JsonResponse
    {
        $entry = $request->user()->journalEntries()
            ->where('entry_date', $date)
            ->firstOrFail();

        $entry->delete();

        return response()->json(null, 204);
    }

    /**
     * Destroy an array of Cloudinary public IDs using a direct signed HTTP request.
     * Uses Laravel Http facade instead of the Cloudinary PHP SDK to avoid SSL issues on Windows.
     */
    private function deleteCloudinaryImages(array $publicIds): void
    {
        if (empty($publicIds)) {
            return;
        }

        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey    = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');
        $isLocal   = env('APP_ENV') === 'local';

        foreach ($publicIds as $publicId) {
            try {
                $timestamp = time();

                // Build the string to sign — must be sorted alphabetically
                $paramsToSign = "public_id={$publicId}&timestamp={$timestamp}";
                $signature    = sha1($paramsToSign . $apiSecret);

                $response = \Illuminate\Support\Facades\Http::withOptions([
                    'verify' => !$isLocal, // disable SSL cert check locally
                ])->asForm()->post(
                    "https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy",
                    [
                        'public_id' => $publicId,
                        'timestamp' => $timestamp,
                        'api_key'   => $apiKey,
                        'signature' => $signature,
                    ]
                );

                if ($response->failed()) {
                    Log::warning("Cloudinary destroy returned non-ok for [{$publicId}]: " . $response->body());
                } else {
                    Log::info("Cloudinary asset deleted: [{$publicId}] — " . $response->json('result', 'unknown'));
                }
            } catch (\Exception $e) {
                Log::error("Failed to delete Cloudinary asset [{$publicId}]: " . $e->getMessage());
            }
        }
    }
}
