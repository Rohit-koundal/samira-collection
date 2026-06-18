import imageCompression from 'browser-image-compression';

const supportedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

export function isSupportedImageFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (supportedTypes.has(type)) return true;
  const name = String(file.name || '').toLowerCase();
  return supportedExtensions.some((extension) => name.endsWith(extension));
}

export async function compressImageFile(file, options = {}) {
  if (!isSupportedImageFile(file)) {
    throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
  }

  const maxOriginalSizeMb = Number(options.maxOriginalSizeMb || 2);
  const softLimitBytes = maxOriginalSizeMb * 1024 * 1024;

  if (file.size <= softLimitBytes) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: Number(options.targetMaxSizeMb || 0.5),
      alwaysKeepResolution: true,
      useWebWorker: true,
      initialQuality: 0.9,
      preserveExif: true,
      fileType: 'image/webp',
    });

    const outputName = String(file.name || 'image').replace(/\.[^.]+$/, '.webp');
    return new File([compressed], outputName, {
      type: 'image/webp',
      lastModified: file.lastModified || Date.now(),
    });
  } catch (error) {
    throw new Error(error.message || 'Image compression failed. Please try again.');
  }
}
