<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Template;

class TemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Template::query();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }

        $templates = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $template = Template::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $template,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'platform_id' => 'nullable|integer|exists:platforms,id',
            'type' => 'required|in:title,meta,cta,intro,conclusion',
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'variables' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $template = Template::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Template créé avec succès',
            'data' => $template,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $template = Template::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'variables' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $template->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Template modifié avec succès',
            'data' => $template,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $template = Template::findOrFail($id);
        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template supprimé avec succès',
        ]);
    }
}

/**
 * CountryController - Liste des pays
 */