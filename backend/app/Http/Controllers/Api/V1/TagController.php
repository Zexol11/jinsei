<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagController extends Controller
{
    /** List all tags for the authenticated user. */
    public function index(Request $request): JsonResponse
    {
        $tags = Tag::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return response()->json($tags);
    }

    /** Create a new tag (normalizes name, deduplicates by slug). */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        $name = trim($data['name']);
        $slug = Str::slug($name);

        // Upsert: return existing if the slug already exists for this user
        $tag = Tag::firstOrCreate(
            ['user_id' => $request->user()->id, 'slug' => $slug],
            ['name' => strtolower($name)]
        );

        return response()->json($tag, $tag->wasRecentlyCreated ? 201 : 200);
    }

    /** Rename a tag. */
    public function update(Request $request, Tag $tag): JsonResponse
    {
        // Ensure user owns this tag
        if ($tag->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $data = $request->validate(['name' => ['required', 'string', 'max:50']]);

        $name = trim($data['name']);
        $slug = Str::slug($name);

        // Check slug uniqueness (excluding this tag)
        $conflict = Tag::where('user_id', $request->user()->id)
            ->where('slug', $slug)
            ->where('id', '!=', $tag->id)
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'A tag with this name already exists.'], 422);
        }

        $tag->update(['name' => strtolower($name), 'slug' => $slug]);

        return response()->json($tag);
    }

    /** Delete a tag. Detaches from all entries automatically via cascade. */
    public function destroy(Request $request, Tag $tag): JsonResponse
    {
        if ($tag->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $tag->delete();

        return response()->json(null, 204);
    }
}
