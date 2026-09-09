/**
 * Utility to compress images on the client-side before form upload.
 * Automatically resizes large images and compresses them under maxSizeBytes (default 1.8MB).
 *
 * @param {File} file - The image File object to compress.
 * @param {number} maxSizeBytes - Maximum size in bytes (default: 1.8 MB).
 * @param {number} maxWidth - Maximum width in pixels (default: 1920).
 * @param {number} maxHeight - Maximum height in pixels (default: 1920).
 * @returns {Promise<File>} Compressed File object.
 */
export async function compressImageIfNeeded(file, maxSizeBytes = 1.8 * 1024 * 1024, maxWidth = 1920, maxHeight = 1920) {
    if (!file || !(file instanceof File)) {
        return file;
    }

    // Only process raster image files (JPEG, PNG, WebP)
    const isImage = file.type.match(/^image\/(jpeg|png|webp|jpg)/i);
    if (!isImage) {
        return file; // If PDF or other file type, return as is
    }

    // If file is already below maxSizeBytes and not huge, we still ensure it fits
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let { width, height } = img;

                // Scale down if dimensions exceed bounds
                if (width > maxWidth || height > maxHeight) {
                    if (width / maxWidth > height / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.85;
                const outputType = file.type === 'image/png' && file.size > maxSizeBytes ? 'image/jpeg' : (file.type || 'image/jpeg');

                const tryCompress = (q) => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve(file);
                                return;
                            }

                            if (blob.size <= maxSizeBytes || q <= 0.3) {
                                const fileName = file.name.replace(/\.[^/.]+$/, "") + (outputType === 'image/jpeg' ? '.jpg' : '.png');
                                const compressedFile = new File([blob], fileName, {
                                    type: outputType,
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                tryCompress(Math.max(0.25, q - 0.15));
                            }
                        },
                        outputType,
                        q
                    );
                };

                tryCompress(quality);
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}
