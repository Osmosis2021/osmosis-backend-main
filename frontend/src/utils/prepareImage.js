// Shrinks photos in the browser before they're uploaded. Phone photos are often 5–20 MB, over
// Cloudinary's 10 MB limit and slow to send; resized to ~2400px they look the same on the site
// and are usually under 1 MB.

const UPLOAD_LIMIT_BYTES = 9.5 * 1024 * 1024; // a little under Cloudinary's 10 MB
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;

export class ImagePrepError extends Error {}

const readAsDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
});

const loadImage = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
    img.src = url;
});

const dataUrlBytes = (dataUrl) => Math.ceil(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

const toJpeg = (img, maxDimension, quality) => {
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; // transparent PNGs get a white background instead of black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // browsers apply the photo's rotation
    return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Returns a data URL ready to upload: the original if it's already small, otherwise a resized JPEG.
 * Throws ImagePrepError with a message for the user if the file can't be used.
 */
export const prepareImage = async (file, { maxDimension = 2400, quality = 0.85 } = {}) => {
    if (!file) throw new ImagePrepError('No file selected.');
    const looksLikeImage = file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name || '');
    if (!looksLikeImage) throw new ImagePrepError(`"${file.name}" isn't a photo.`);

    let img;
    try {
        img = await loadImage(file);
    } catch (err) {
        throw new ImagePrepError(`We couldn't open "${file.name}". Try a JPG or PNG (on iPhone, a screenshot of the photo works).`);
    }

    const smallEnough = file.size <= KEEP_AS_IS_BYTES && Math.max(img.naturalWidth, img.naturalHeight) <= maxDimension;
    if (smallEnough && /image\/(jpeg|png|webp)/.test(file.type)) return readAsDataUrl(file);

    let dataUrl = toJpeg(img, maxDimension, quality);
    if (dataUrlBytes(dataUrl) > UPLOAD_LIMIT_BYTES) dataUrl = toJpeg(img, Math.min(maxDimension, 1800), 0.7);
    if (dataUrlBytes(dataUrl) > UPLOAD_LIMIT_BYTES) throw new ImagePrepError(`"${file.name}" is too large to upload.`);
    return dataUrl;
};

/** Prepares several photos; returns the ones that worked and a message for each that didn't. */
export const prepareImages = async (files, options) => {
    const results = await Promise.all(Array.from(files || []).map(async (file) => {
        try {
            return { dataUrl: await prepareImage(file, options) };
        } catch (err) {
            return { error: err instanceof ImagePrepError ? err.message : `We couldn't use "${file.name}".` };
        }
    }));
    return {
        images: results.filter((r) => r.dataUrl).map((r) => r.dataUrl),
        errors: results.filter((r) => r.error).map((r) => r.error),
    };
};
