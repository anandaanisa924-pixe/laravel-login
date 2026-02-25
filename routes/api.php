<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WorkOrderController;

Route::get('/workorders', [WorkOrderController::class, 'api']);