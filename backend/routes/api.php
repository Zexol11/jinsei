<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Public auth routes
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login',    [AuthController::class, 'login']);
    });

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        
        Route::prefix('auth')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me',      [AuthController::class, 'me']);
            Route::patch('me',    [AuthController::class, 'update']);
        });
        
        // Journal Entries
        Route::get('entries', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'index']);
        Route::get('entries/calendar', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'calendar']);
        Route::post('entries', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'store']);
        Route::get('entries/{date}', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'show']);
        Route::patch('entries/{date}', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'update']);
        Route::delete('entries/{date}', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'destroy']);
        
        // Moods
        Route::get('moods', function () {
            return response()->json(App\Models\Mood::orderBy('value', 'asc')->get());
        });
        
        // Insights
        Route::get('insights', [App\Http\Controllers\Api\V1\InsightsController::class, 'index']);

        // Trash (soft-deleted entries)
        Route::get('trash', [App\Http\Controllers\Api\V1\TrashController::class, 'index']);
        Route::post('trash/{date}/restore', [App\Http\Controllers\Api\V1\TrashController::class, 'restore']);
        Route::delete('trash/{date}', [App\Http\Controllers\Api\V1\TrashController::class, 'forceDestroy']);

        // Memories
        Route::get('memories/on-this-day', [App\Http\Controllers\Api\V1\MemoryController::class, 'onThisDay']);

        // Tags
        Route::get('tags', [App\Http\Controllers\Api\V1\TagController::class, 'index']);
        Route::post('tags', [App\Http\Controllers\Api\V1\TagController::class, 'store']);
        Route::patch('tags/{tag}', [App\Http\Controllers\Api\V1\TagController::class, 'update']);
        Route::delete('tags/{tag}', [App\Http\Controllers\Api\V1\TagController::class, 'destroy']);
    });
});
