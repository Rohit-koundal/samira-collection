import { useRef, useState } from 'react';
import api from '../../services/api';
import { normalizeImageUrl } from '../../services/normalize';
import { compressImageFile, isSupportedImageFile } from '../../services/imageCompression';

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUploader({
  value = [],
  onChange,
  multiple = false,
  maxFiles = 1,
  compressAboveMb = 2,
  maxUploadMb = 20,
  targetSizeMb = 0.5,
  label = 'Choose Images',
  helpText = 'Drag and drop or click to upload.',
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState('');
  const [progress, setProgress] = useState(0);

  const files = (Array.isArray(value) ? value : value ? [value] : []).filter((file) => file?.url);

  const addFiles = async (selected) => {
    setError('');
    setPhase('');
    setProgress(0);
    const incoming = Array.from(selected);
    if (!incoming.length) return;
    if (files.length + incoming.length > maxFiles) return setError(`Maximum ${maxFiles} image${maxFiles > 1 ? 's' : ''} allowed.`);

    setUploading(true);
    try {
      const converted = [];
      for (const file of incoming) {
        if (!isSupportedImageFile(file) || !allowedTypes.includes(file.type)) {
          throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
        }
        if (file.size > maxUploadMb * 1024 * 1024) {
          throw new Error(`Each image must be under ${maxUploadMb}MB before compression.`);
        }
        setPhase('compressing');
        const compressedFile = await compressImageFile(file, {
          maxOriginalSizeMb: compressAboveMb,
          targetMaxSizeMb: targetSizeMb,
          onProgress: (value) => setProgress(Math.max(0, Math.min(100, Math.round(value || 0)))),
        });
        converted.push(compressedFile);
      }

      setPhase('uploading');
      setProgress(100);
      const data = await api.upload('/admin/uploads', converted);
      const uploadedFiles = Array.isArray(data.files) ? data.files.filter((file) => file?.url) : [];
      if (!uploadedFiles.length) throw new Error('No image was uploaded. Please try again.');
      const uploaded = uploadedFiles.map((file, index) => ({ ...file, primary: files.length === 0 && index === 0 }));
      onChange(multiple ? [...files, ...uploaded] : uploaded.slice(0, 1));
    } catch (uploadError) {
      setError(uploadError.message || 'Image upload failed. Please try again.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
      setUploading(false);
      setPhase('');
      setProgress(0);
    }
  };

  const remove = (index) => {
    const next = files.filter((_, itemIndex) => itemIndex !== index);
    onChange(next.map((item, itemIndex) => ({ ...item, primary: itemIndex === 0 ? true : item.primary })));
  };

  const markPrimary = (index) => onChange(files.map((item, itemIndex) => ({ ...item, primary: itemIndex === index })));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}
        onDragOver={(event) => event.preventDefault()}
        className="grid min-h-40 w-full place-items-center rounded-2xl border-2 border-dashed border-wine/30 bg-[#fbf8f4] p-5 text-center transition hover:border-wine"
      >
        <span>
          <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-wine text-lg font-black text-white">+</span>
          <span className="block text-sm font-black text-charcoal">
            {uploading ? (phase === 'compressing' ? 'Compressing images...' : 'Uploading images...') : label}
          </span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{helpText}</span>
          <span className="mt-3 inline-flex rounded-xl bg-white px-4 py-2 text-xs font-black text-wine shadow-sm">Browse Files</span>
        </span>
      </button>
      {uploading && (
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{phase === 'compressing' ? 'Compressing' : 'Uploading'}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-wine transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple={multiple} onChange={(event) => addFiles(event.target.files)} className="hidden" />
      {error && <p className="text-sm font-bold text-rose">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {files.map((file, index) => (
          <div key={`${file.url}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img src={normalizeImageUrl(file.url)} alt={file.originalName || file.name || 'Upload preview'} className="h-28 w-full object-cover" />
            {file.primary && <span className="absolute left-2 top-2 rounded-full bg-wine px-2 py-1 text-[10px] font-black text-white">Primary</span>}
            <div className="grid grid-cols-2">
              <button type="button" onClick={() => markPrimary(index)} className="h-9 text-xs font-black text-wine">Main</button>
              <button type="button" onClick={() => remove(index)} className="h-9 text-xs font-black text-rose">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
