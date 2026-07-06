/**
 * Resizes and re-encodes an image file entirely in the browser before it's sent
 * anywhere. Two problems this solves at once:
 *
 * 1. Photo-library photos (vs. a fresh camera capture) are often much larger —
 *    a modern phone's original library photo can be 5-15MB. Base64-encoding
 *    that for a Server Action adds ~33% on top, which can trip request-size
 *    limits.
 * 2. iPhones default to HEIC for photo-library images. Re-encoding through a
 *    canvas always outputs a standard format (JPEG here) regardless of input,
 *    so the AI vision call always receives something it's guaranteed to
 *    support — no format-detection guesswork needed.
 */
export async function resizeImageFile(
  file: File,
  { maxDimension = 1280, quality = 0.85 }: { maxDimension?: number; quality?: number } = {}
): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  const source = await loadImageSource(file);
  const { width: sourceWidth, height: sourceHeight } = getDimensions(source);

  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");
  ctx.drawImage(source, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.split(",")[1] ?? "";

  return { base64, mimeType: "image/jpeg", dataUrl };
}

async function loadImageSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof window !== "undefined" && "createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Some HEIC variants or older browsers can fail here — fall back below.
    }
  }

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image"));
    img.src = URL.createObjectURL(file);
  });
}

function getDimensions(source: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}
