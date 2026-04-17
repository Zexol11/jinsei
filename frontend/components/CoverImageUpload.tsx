import { useState, useRef } from 'react';
import { Loader2, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';

interface CoverImageUploadProps {
  imageUrl: string | null;
  caption: string;
  onImageChange: (url: string | null, publicId?: string | null) => void;
  onCaptionChange: (caption: string) => void;
}

export default function CoverImageUpload({ imageUrl, caption, onImageChange, onCaptionChange }: CoverImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary not configured');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onImageChange(data.secure_url, data.public_id);
    } catch (err) {
      console.error(err);
      alert('Failed to upload cover photo');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploading(false);
    }
  }

  if (imageUrl) {
    return (
      <div 
        className="relative group transition-transform hover:scale-[1.01] hover:-rotate-1 duration-300 ml-auto"
        style={{ width: 'fit-content' }}
      >
        <button
          onClick={() => { onImageChange(null, null); onCaptionChange(''); }}
          className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-white shadow-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove Photo"
        >
          <X size={16} />
        </button>

        <div 
          className="bg-white p-4 pb-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-sm rotate-1 transform"
          style={{ width: '320px' }}
        >
          <div className="relative aspect-square w-full mb-4 overflow-hidden" style={{ background: '#f5f5f5' }}>
            <Image 
              src={imageUrl} 
              alt={caption ? `Cover photo preview: ${caption}` : 'Cover photo upload preview'} 
              fill
              className="object-cover"
            />
          </div>
          <input
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption..."
            className="w-full text-center text-sm italic outline-none bg-transparent transition-colors placeholder:text-gray-300"
            style={{ 
              color: 'var(--on-surface-variant)', 
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ml-auto w-[320px]">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-colors group h-[320px]"
        style={{ 
          borderColor: 'var(--outline-variant)',
          background: 'var(--surface-container)'
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600" />
            <span className="text-sm font-medium">Uploading photo...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-700 transition-colors">
            <ImagePlus className="w-8 h-8 mb-3" />
            <span className="text-sm font-medium">Insert a photo of today</span>
          </div>
        )}
      </button>
    </div>
  );
}
