<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreMediaAssetRequest;
use App\Models\MediaAsset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaAssetController extends Controller
{
    public function store(StoreMediaAssetRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $file = $request->file('file');
        
        $originalFile = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        
        // Use the 'name' field from the form (Judul) for the slug instead of the physical filename
        $slugName = Str::slug($validated['name']);
        
        // Generate a clean slug filename with a short random suffix to avoid collisions
        $filename = $slugName . '-' . Str::lower(Str::random(6)) . '.' . $extension;
        
        $path = $file->storeAs('media_assets', $filename, 'public');
        
        MediaAsset::create([
            'name'      => $validated['name'],
            'file_name' => $originalFile,
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size'      => $file->getSize(),
        ]);

        return redirect()->back()->with('success', 'Media asset berhasil diunggah.');
    }

    public function destroy(MediaAsset $mediaAsset): RedirectResponse
    {
        if ($mediaAsset->file_path && Storage::disk('public')->exists($mediaAsset->file_path)) {
            Storage::disk('public')->delete($mediaAsset->file_path);
        }
        
        $mediaAsset->delete();

        return redirect()->back()->with('success', 'Media asset berhasil dihapus.');
    }
}
