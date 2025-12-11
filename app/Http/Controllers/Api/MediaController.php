<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * MediaController - Gestion complète des médias
 * 
 * Gestion des uploads, images, documents et fichiers
 */
class MediaController extends Controller
{
    /**
     * Liste tous les médias avec pagination et filtres
     * 
     * GET /api/admin/media
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->get('per_page', 24);
            $page = (int) $request->get('page', 1);
            $type = $request->get('type'); // image, video, document, audio
            $folder = $request->get('folder');
            $search = $request->get('search');

            $disk = Storage::disk('public');
            $basePath = 'media';
            
            // Récupérer tous les fichiers
            $allFiles = $disk->allFiles($basePath);
            
            // Filtrer par type si spécifié
            if ($type) {
                $allFiles = array_filter($allFiles, function($file) use ($type) {
                    return $this->getFileType($file) === $type;
                });
            }
            
            // Filtrer par folder si spécifié
            if ($folder) {
                $allFiles = array_filter($allFiles, function($file) use ($folder, $basePath) {
                    return strpos($file, "$basePath/$folder/") === 0;
                });
            }
            
            // Filtrer par recherche
            if ($search) {
                $allFiles = array_filter($allFiles, function($file) use ($search) {
                    return stripos(basename($file), $search) !== false;
                });
            }
            
            // Mapper les fichiers avec leurs métadonnées
            $files = array_map(function($file) use ($disk) {
                return [
                    'id' => md5($file),
                    'name' => basename($file),
                    'path' => $file,
                    'url' => Storage::url($file),
                    'type' => $this->getFileType($file),
                    'size' => $disk->size($file),
                    'mime_type' => $disk->mimeType($file),
                    'created_at' => date('Y-m-d H:i:s', $disk->lastModified($file)),
                ];
            }, array_values($allFiles));
            
            // Trier par date décroissante
            usort($files, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            
            // Pagination manuelle
            $total = count($files);
            $lastPage = ceil($total / $perPage);
            $offset = ($page - 1) * $perPage;
            $paginatedFiles = array_slice($files, $offset, $perPage);

            return response()->json([
                'success' => true,
                'data' => $paginatedFiles,
                'total' => $total,
                'current_page' => $page,
                'per_page' => $perPage,
                'last_page' => $lastPage,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des médias',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques des médias
     * 
     * GET /api/admin/media/stats
     */
    public function stats(): JsonResponse
    {
        try {
            $disk = Storage::disk('public');
            $basePath = 'media';
            $allFiles = $disk->allFiles($basePath);
            
            $stats = [
                'total' => count($allFiles),
                'by_type' => [
                    'image' => 0,
                    'video' => 0,
                    'document' => 0,
                    'audio' => 0,
                ],
                'total_size' => 0,
                'recent_uploads' => 0,
            ];
            
            $oneDayAgo = time() - 86400;
            
            foreach ($allFiles as $file) {
                $type = $this->getFileType($file);
                $stats['by_type'][$type]++;
                $stats['total_size'] += $disk->size($file);
                
                if ($disk->lastModified($file) >= $oneDayAgo) {
                    $stats['recent_uploads']++;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Liste des dossiers
     * 
     * GET /api/admin/media/folders
     */
    public function folders(): JsonResponse
    {
        try {
            $disk = Storage::disk('public');
            $basePath = 'media';
            
            // Créer les dossiers par défaut s'ils n'existent pas
            $defaultFolders = ['images', 'documents', 'videos', 'audio'];
            foreach ($defaultFolders as $folder) {
                $folderPath = "$basePath/$folder";
                if (!$disk->exists($folderPath)) {
                    $disk->makeDirectory($folderPath);
                }
            }
            
            $allDirectories = $disk->directories($basePath);
            
            $folders = array_map(function($dir) use ($disk, $basePath) {
                $name = basename($dir);
                $files = $disk->files($dir);
                
                return [
                    'id' => md5($dir),
                    'name' => ucfirst($name),
                    'path' => $dir,
                    'count' => count($files),
                ];
            }, $allDirectories);

            return response()->json([
                'success' => true,
                'data' => $folders,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des dossiers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Détails d'un média spécifique
     * 
     * GET /api/admin/media/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            $disk = Storage::disk('public');
            $basePath = 'media';
            $allFiles = $disk->allFiles($basePath);
            
            $file = null;
            foreach ($allFiles as $f) {
                if (md5($f) === $id) {
                    $file = $f;
                    break;
                }
            }
            
            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'Média non trouvé',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $id,
                    'name' => basename($file),
                    'path' => $file,
                    'url' => Storage::url($file),
                    'type' => $this->getFileType($file),
                    'size' => $disk->size($file),
                    'mime_type' => $disk->mimeType($file),
                    'created_at' => date('Y-m-d H:i:s', $disk->lastModified($file)),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du média',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload d'un nouveau média
     * 
     * POST /api/admin/media
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:10240', // 10MB max
                'folder' => 'nullable|string|in:images,documents,videos,audio',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation échouée',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('file');
            $folder = $request->get('folder', 'images');
            
            // Générer un nom unique
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $filename = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '_' . time() . '.' . $extension;
            
            // Stocker le fichier
            $path = $file->storeAs("media/$folder", $filename, 'public');
            
            $disk = Storage::disk('public');

            return response()->json([
                'success' => true,
                'message' => 'Média uploadé avec succès',
                'data' => [
                    'id' => md5($path),
                    'name' => $filename,
                    'path' => $path,
                    'url' => Storage::url($path),
                    'type' => $this->getFileType($path),
                    'size' => $disk->size($path),
                    'mime_type' => $disk->mimeType($path),
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload du média',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mettre à jour un média (renommer)
     * 
     * PUT /api/admin/media/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation échouée',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $disk = Storage::disk('public');
            $basePath = 'media';
            $allFiles = $disk->allFiles($basePath);
            
            $oldFile = null;
            foreach ($allFiles as $f) {
                if (md5($f) === $id) {
                    $oldFile = $f;
                    break;
                }
            }
            
            if (!$oldFile) {
                return response()->json([
                    'success' => false,
                    'message' => 'Média non trouvé',
                ], 404);
            }

            // Nouveau nom avec extension
            $newName = $request->get('name');
            $extension = pathinfo($oldFile, PATHINFO_EXTENSION);
            if (!str_ends_with($newName, ".$extension")) {
                $newName .= ".$extension";
            }
            
            $newPath = dirname($oldFile) . '/' . $newName;
            
            // Renommer le fichier
            $disk->move($oldFile, $newPath);

            return response()->json([
                'success' => true,
                'message' => 'Média renommé avec succès',
                'data' => [
                    'id' => md5($newPath),
                    'name' => basename($newPath),
                    'path' => $newPath,
                    'url' => Storage::url($newPath),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du média',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un média
     * 
     * DELETE /api/admin/media/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $disk = Storage::disk('public');
            $basePath = 'media';
            $allFiles = $disk->allFiles($basePath);
            
            $file = null;
            foreach ($allFiles as $f) {
                if (md5($f) === $id) {
                    $file = $f;
                    break;
                }
            }
            
            if (!$file) {
                return response()->json([
                    'success' => false,
                    'message' => 'Média non trouvé',
                ], 404);
            }

            $disk->delete($file);

            return response()->json([
                'success' => true,
                'message' => 'Média supprimé avec succès',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du média',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Déterminer le type de fichier
     */
    private function getFileType(string $path): string
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        
        $imageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
        $videoExt = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
        $audioExt = ['mp3', 'wav', 'ogg', 'flac', 'aac'];
        $documentExt = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
        
        if (in_array($extension, $imageExt)) {
            return 'image';
        } elseif (in_array($extension, $videoExt)) {
            return 'video';
        } elseif (in_array($extension, $audioExt)) {
            return 'audio';
        } elseif (in_array($extension, $documentExt)) {
            return 'document';
        }
        
        return 'document';
    }
}
