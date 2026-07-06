"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PhotoCapture({
  useCameraCapture,
  onAnalyze,
}: {
  /** true for "Take Photo" (opens camera directly on mobile), false for "Upload Photo" (gallery/file picker) */
  useCameraCapture: boolean;
  onAnalyze: (imageBase64: string, mimeType: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; base64: string; mimeType: string } | null>(
    null
  );

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      setPreview({ url: dataUrl, base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

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
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture={useCameraCapture ? "environment" : undefined}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative h-64 w-full max-w-xs overflow-hidden rounded-2xl">
        <Image src={preview.url} alt="Meal preview" fill className="object-cover" />
      </div>
      <div className="flex w-full max-w-xs gap-2">
        <Button variant="outline" size="md" onClick={() => setPreview(null)} className="flex-1">
          <RotateCcw size={16} /> Retake
        </Button>
        <Button
          size="md"
          className="flex-1"
          onClick={() => onAnalyze(preview.base64, preview.mimeType)}
        >
          Analyze meal
        </Button>
      </div>
    </div>
  );
}
