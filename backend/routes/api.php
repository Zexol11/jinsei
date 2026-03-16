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
        });
        
        // Journal Entries
        Route::get('entries', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'index']);
        Route::post('entries', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'store']);
        Route::get('entries/{date}', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'show']);
        Route::patch('entries/{date}', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'update']);
        Route::delete('entries/{date}', [App\Http\Controllers\Api\V1\JournalEntryController::class, 'destroy']);
        
        // Moods
        Route::get('moods', function () {
            return response()->json(App\Models\Mood::orderBy('value', 'asc')->get());
        });
    });
});
