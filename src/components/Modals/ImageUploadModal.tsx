import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Trash2, Upload, X } from 'lucide-react';

interface ImageLibraryItem {
  id: string;
  name?: string;
  url: string;
  createdAt?: string;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => void;
  title: string;
  currentImage?: string;
  libraryImages?: ImageLibraryItem[];
  onSaveToLibrary?: (imageUrl: string, imageName?: string) => Promise<void> | void;
  onDeleteFromLibrary?: (imageId: string) => Promise<void> | void;
}

export const ImageUploadModal = ({
  isOpen,
  onClose,
  onImageSelect,
  title,
  currentImage,
  libraryImages = [],
  onSaveToLibrary,
  onDeleteFromLibrary
}: ImageUploadModalProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(currentImage || null);
  const [libraryName, setLibraryName] = useState('');
  const [libraryBusy, setLibraryBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setImagePreview(currentImage || null);
      setLibraryName('');
    }
  }, [isOpen, currentImage]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (imagePreview) {
      onImageSelect(imagePreview);
      onClose();
    }
  };

  const handleSaveToLibrary = async () => {
    if (!imagePreview || !onSaveToLibrary) return;
    setLibraryBusy(true);
    try {
      await onSaveToLibrary(imagePreview, libraryName.trim() || undefined);
      setLibraryName('');
    } finally {
      setLibraryBusy(false);
    }
  };

  const handleDeleteFromLibrary = async (imageId: string) => {
    if (!onDeleteFromLibrary) return;
    setLibraryBusy(true);
    try {
      await onDeleteFromLibrary(imageId);
    } finally {
      setLibraryBusy(false);
    }
  };

  const handleRemove = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setImagePreview(currentImage || null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full max-h-48 mx-auto rounded object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Přetáhněte obrázek sem nebo klikněte pro výběr
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Podporované formáty: PNG, JPG, GIF
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">Nebo vyberte soubor</Label>
            <Input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="cursor-pointer"
            />
          </div>

          {onSaveToLibrary && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <Label htmlFor="image-library-name">Uložit do banky obrázků</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="image-library-name"
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                  placeholder="Název obrázku (volitelně)"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveToLibrary}
                  disabled={!imagePreview || libraryBusy}
                >
                  Uložit do banky
                </Button>
              </div>
            </div>
          )}

          {libraryImages.length > 0 && (
            <div className="space-y-2">
              <Label>Banka obrázků</Label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {libraryImages.map((image) => (
                  <div key={image.id} className="rounded-md border border-border p-2 space-y-2">
                    <img
                      src={image.url}
                      alt={image.name || 'Obrázek z banky'}
                      className="h-20 w-full rounded object-cover bg-muted"
                    />
                    <p className="text-xs text-muted-foreground truncate" title={image.name || ''}>
                      {image.name || 'Bez názvu'}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onImageSelect(image.url);
                          onClose();
                        }}
                      >
                        Použít
                      </Button>
                      {onDeleteFromLibrary && (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleDeleteFromLibrary(image.id)}
                          disabled={libraryBusy}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border -mx-6 px-6 pt-4 pb-1 flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Zrušit
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!imagePreview}
              className="bg-gradient-primary text-white"
            >
              Uložit obrázek
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
