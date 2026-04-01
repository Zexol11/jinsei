<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
     * Permanently delete a soft-deleted entry and clean up its Cloudinary assets.
     */
    public function forceDestroy(Request $request, string $date): JsonResponse
    {
        $entry = JournalEntry::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->where('entry_date', $date)
            ->firstOrFail();

        // 1. Extract public IDs from the entry content and delete from Cloudinary
        $content = $entry->content;
        $publicIds = [];

        // 1. Extract images from Tiptap content
        if (str_contains($content, 'data-public-id')) {
            $dom = new \DOMDocument();
            @$dom->loadHTML('<?xml encoding="utf-8" ?>' . $content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            $images = $dom->getElementsByTagName('img');
            
            foreach ($images as $img) {
                if ($img instanceof \DOMElement && $img->hasAttribute('data-public-id')) {
                    $publicIds[] = $img->getAttribute('data-public-id');
                }
            }
        }
        
        // 2. Extract cover photo ID
        if ($entry->cover_image_url && preg_match('/\/v\d+\/([^\/.]+)\.[a-zA-Z0-9]+$/', $entry->cover_image_url, $matches)) {
            $publicIds[] = $matches[1];
        }

        $this->deleteCloudinaryImages($publicIds);

        $entry->forceDelete();

        return response()->json(null, 204);
    }

    /**
     * Permanently delete ALL soft-deleted entries to empty the trash.
     */
    public function empty(Request $request): JsonResponse
    {
        $entries = JournalEntry::onlyTrashed()
            ->where('user_id', $request->user()->id)
            ->get();

        foreach ($entries as $entry) {
            $content = $entry->content;
            $publicIds = [];

            if (str_contains($content, 'data-public-id')) {
                $dom = new \DOMDocument();
                @$dom->loadHTML('<?xml encoding="utf-8" ?>' . $content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
                $images = $dom->getElementsByTagName('img');
                
                foreach ($images as $img) {
                    if ($img instanceof \DOMElement && $img->hasAttribute('data-public-id')) {
                        $publicIds[] = $img->getAttribute('data-public-id');
                    }
                }
            }

            if ($entry->cover_image_url && preg_match('/\/v\d+\/([^\/.]+)\.[a-zA-Z0-9]+$/', $entry->cover_image_url, $matches)) {
                $publicIds[] = $matches[1];
            }

            if (!empty($publicIds)) {
                $this->deleteCloudinaryImages($publicIds);
            }
            $entry->forceDelete();
        }

        return response()->json(['message' => 'Trash emptied successfully.']);
    }

    /**
     * Destroy Cloudinary assets using a direct signed HTTP POST.
     * Avoids the Cloudinary PHP SDK's SSL issues on Windows local environments.
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

                // Build the string to sign — parameters must be sorted alphabetically
                $paramsToSign = "public_id={$publicId}&timestamp={$timestamp}";
                $signature    = sha1($paramsToSign . $apiSecret);

                $response = Http::withOptions([
                    'verify' => !$isLocal,
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
                    Log::warning("Cloudinary destroy failed for [{$publicId}]: " . $response->body());
                } else {
                    Log::info("Cloudinary asset deleted: [{$publicId}] — " . $response->json('result', 'unknown'));
                }
            } catch (\Exception $e) {
                Log::error("Exception deleting Cloudinary asset [{$publicId}]: " . $e->getMessage());
            }
        }
    }
}
