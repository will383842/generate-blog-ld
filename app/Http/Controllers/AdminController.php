<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Affiche la console d'administration React
     */
    public function index()
    {
        return view('admin');
    }
}