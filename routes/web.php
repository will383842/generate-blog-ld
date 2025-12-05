<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return view('welcome');
});

// Login manuel
Route::get('/login', function () {
    return view('login');
})->name('login');

Route::post('/login', function (Illuminate\Http\Request $request) {
    $credentials = $request->only('email', 'password');
    
    if (Auth::attempt($credentials)) {
        $request->session()->regenerate();
        return redirect()->intended('/admin');
    }
    
    return back()->withErrors([
        'email' => 'Identifiants incorrects.',
    ]);
});

Route::post('/logout', function (Illuminate\Http\Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/login');
})->name('logout');

// Routes Admin avec AUTH
Route::middleware(['auth'])->prefix('admin')->group(function () {
    Route::get('/{any?}', [AdminController::class, 'index'])
        ->where('any', '.*')
        ->name('admin.index');
});