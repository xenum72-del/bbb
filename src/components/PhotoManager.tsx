interface PhotoManagerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
  className?: string;
}

export default function PhotoManager({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  maxSizeMB = 5,
  className = ''
}: PhotoManagerProps) {
  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: string[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
      const file = files[i];
      
      if (file.size > maxSizeBytes) {
        alert(`${file.name} is too large. Max size is ${maxSizeMB}MB.`);
        continue;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newPhotos.push(result);
        
        // Update when all files are processed
        if (newPhotos.length === Math.min(files.length, maxPhotos - photos.length)) {
          onPhotosChange([...photos, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChoosePhotos = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleFileSelection((e.target as HTMLInputElement).files);
    input.click();
  };

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera
    input.onchange = (e) => handleFileSelection((e.target as HTMLInputElement).files);
    input.click();
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  const clearAllPhotos = () => {
    onPhotosChange([]);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium mb-1">
        Photos 
        <span className="text-xs text-gray-500 ml-2">
          ({photos.length}/{maxPhotos} • max {maxSizeMB}MB each)
        </span>
      </label>

      {/* Photo Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleChoosePhotos}
          disabled={photos.length >= maxPhotos}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          📷 Choose Photos
        </button>

        <button
          type="button"
          onClick={handleTakePhoto}
          disabled={photos.length >= maxPhotos}
          className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          📱 Take Photo
        </button>

        {photos.length > 0 && (
          <button
            type="button"
            onClick={clearAllPhotos}
            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-20 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-gray-500">
        Photos are stored locally in your browser. Use the backup feature to preserve them.
      </div>
    </div>
  );
}