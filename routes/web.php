<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkOrderController;

Route::get('/', [WorkOrderController::class, 'index'])
    ->name('dashboard');

Route::get('/dashboard', [WorkOrderController::class, 'index']);

require __DIR__.'/settings.php';