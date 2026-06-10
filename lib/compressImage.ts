/**
 * Compress an image file client-side before uploading.
 *
 * - Resizes to at most maxWidth px (preserving aspect ratio).
 * - Encodes as WebP at the given quality; falls back to JPEG on browsers
 *   that don't support WebP canvas output (old Safari).
 * - Returns a new File so the original filename is preserved (with the new ext).
 */
export async function compressImage(
  file: File,
  maxWidth = 2000,
  quality = 0.8
): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);

    // Scale down only if wider than maxWidth; never upscale.
    let { width, height } = img;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    const canvas = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // White background so transparent PNGs don't become black when JPEG-encoded
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Prefer WebP; fall back to JPEG if the browser doesn't encode it
    // (canvas.toBlob silently outputs image/png for unsupported types per spec)
    const webpBlob = await canvasToBlob(canvas, "image/webp", quality);
    const blob = webpBlob?.type === "image/webp"
      ? webpBlob
      : await canvasToBlob(canvas, "image/jpeg", quality);

    if (!blob) throw new Error("Canvas produced an empty blob");

    const ext  = blob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.${ext}`, { type: blob.type });

  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image for compression"));
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
