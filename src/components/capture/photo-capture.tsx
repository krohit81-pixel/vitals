"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resizeImageFile } from "@/lib/nutrition/image-resize";

export function PhotoCapture({
  useCameraCapture,
  onAnalyze,
}: {
  /** true for "Take Photo" (opens camera directly on mobile), false for "Upload Photo" (gallery/file picker) */
  useCameraCapture: boolean;
  onAnalyze: (imageBase64: string, mimeType: string, note?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; base64: string; mimeType: string } | null>(
    null
  );
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setProcessing(true);
    try {
      // Resize + re-encode to JPEG here — handles both oversized photo-library
      // images and HEIC (iPhone's default format), which the AI vision call
      // shouldn't have to deal with directly.
      const { base64, mimeType, dataUrl } = await resizeImageFile(file);
      setPreview({ url: dataUrl, base64, mimeType });
    } catch {
      setError("Couldn't process that photo — try a different one.");
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="flex flex-col items-center gap-3 py-14">
        <div className="skeleton h-32 w-32 rounded-2xl" />
        <p className="text-sm text-black/50 dark:text-white/50">Processing photo…</p>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <button
          onClick={() => inputRef.current?.click()}
          className="pressable flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
        >
          <Camera size={28} />
          <span className="text-xs font-medium">
            {useCameraCapture ? "Open camera" : "Choose photo"}
          </span>
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture={useCameraCapture ? "environment" : undefined}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative h-64 w-full max-w-xs overflow-hidden rounded-2xl">
        <Image src={preview.url} alt="Meal preview" fill className="object-cover" />
      </div>

      {/* Optional — lets the AI account for things a photo alone can't show:
          a partial portion, how a powder/concentrate was diluted, etc. */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={'Add a note (optional) — e.g. "only ate half the packet"'}
        rows={2}
        className="w-full max-w-xs resize-none rounded-xl border border-black/[0.08] bg-white/70 p-3 text-sm outline-none placeholder:text-black/35 focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:placeholder:text-white/35"
      />

      <div className="flex w-full max-w-xs gap-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            setPreview(null);
            setNote("");
          }}
          className="flex-1"
        >
          <RotateCcw size={16} /> Retake
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={() => onAnalyze(preview.base64, preview.mimeType, note.trim() || undefined)}
        >
          Analyze meal
        </Button>
      </div>
    </div>
  );
}
