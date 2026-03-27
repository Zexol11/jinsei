<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Log;

class CloudinaryController extends Controller
{
    public function destroy(Request $request)
    {
        $request->validate([
            'public_id' => 'required|string',
        ]);

        try {
            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                    'api_key'    => env('CLOUDINARY_API_KEY'),
                    'api_secret' => env('CLOUDINARY_API_SECRET'),
                ],
                // Disable SSL verification in local development to avoid cURL error 60
                'http_client_options' => [
                    'verify' => env('APP_ENV') !== 'local',
                ],
            ]);

            $result = $cloudinary->uploadApi()->destroy($request->public_id);

            if ($result['result'] === 'ok') {
                return response()->json([
                    'message' => 'Image deleted successfully from Cloudinary',
                    'result' => $result
                ]);
            }

            return response()->json([
                'message' => 'Failed to delete image from Cloudinary',
                'result' => $result
            ], 400);

        } catch (\Exception $e) {
            Log::error('Cloudinary deletion error: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred during Cloudinary deletion',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
