<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BrandSection;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class BrandSectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BrandSection::with('platform');
        
        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }
        if ($request->has('section')) {
            $query->where('section', $request->section);
        }
        if ($request->has('language')) {
            $query->where('language', $request->language);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $sections = $query->get();
        return response()->json(['success' => true, 'data' => $sections]);
    }

    public function show(int $id): JsonResponse
    {
        $section = BrandSection::with('platform')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $section]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform_id' => 'required|exists:platforms,id',
            'section' => 'required|string|in:' . implode(',', array_keys(BrandSection::SECTIONS)),
            'content' => 'required|array',
            'language' => 'sometimes|string|max:5',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $section = BrandSection::create($validator->validated());
        return response()->json(['success' => true, 'data' => $section, 'message' => 'Section créée'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $section = BrandSection::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'content' => 'sometimes|required|array',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $section->update($validator->validated());
        return response()->json(['success' => true, 'data' => $section, 'message' => 'Section mise à jour']);
    }

    public function destroy(int $id): JsonResponse
    {
        $section = BrandSection::findOrFail($id);
        $section->delete();
        return response()->json(['success' => true, 'message' => 'Section supprimée']);
    }
}
