"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PhotoCapture } from "@/components/capture/photo-capture";
import { ManualEntry } from "@/components/capture/manual-entry";
import { VoiceCapture } from "@/components/capture/voice-capture";
import { MealReview } from "@/components/capture/meal-review";
import { inferMealType, type MealType } from "@/lib/nutrition/meal-type";
import type { MealAnalysis } from "@/lib/ai/types";
import {
  analyzeMealPhotoAction,
  analyzeMealTextAction,
  refineWithClarificationAction,
  saveMealAction,
} from "./actions";

type Mode = "photo" | "upload" | "manual" | "voice";

const TITLES: Record<Mode, string> = {
  photo: "Take a photo",
  upload: "Upload a photo",
  manual: "Manual entry",
  voice: "Voice entry",
};

export default function NewMealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "manual";

  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [mealType, setMealType] = useState<MealType>(inferMealType());
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [rawInput, setRawInput] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<"idle" | "analyzing" | "refining" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePhotoAnalyze = async (imageBase64: string, mimeType: string) => {
    setStatus("analyzing");
    try {
      const result = await analyzeMealPhotoAction(imageBase64, mimeType);
      setPendingImage({ base64: imageBase64, mimeType });
      setAnalysis(result);
      setStatus("idle");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong analyzing that photo.");
      setStatus("error");
    }
  };

  const handleTextAnalyze = async (description: string, source: "manual" | "voice") => {
    setStatus("analyzing");
    try {
      const result = await analyzeMealTextAction(description);
      setRawInput(description);
      setAnalysis(result);
      setStatus("idle");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong analyzing that meal.");
      setStatus("error");
    }
    void source; // source is persisted at save time via `mode`
  };

  const handleClarify = async (answers: Array<{ question: string; answer: "yes" | "no" }>) => {
    if (!analysis) return;
    setStatus("refining");
    try {
      const refined = await refineWithClarificationAction(analysis, answers);
      setAnalysis(refined);
      setStatus("idle");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't update the estimate.");
      setStatus("error");
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setStatus("saving");
    try {
      await saveMealAction({
        mealType,
        source: mode === "photo" || mode === "upload" ? "photo" : mode,
        rawInput,
        analysis,
        imageBase64: pendingImage?.base64,
        imageMimeType: pendingImage?.mimeType,
      });
      router.push("/meals");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Couldn't save that meal.");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">
          {analysis ? "Review meal" : TITLES[mode]}
        </h1>
      </div>

      {status === "analyzing" && <AnalyzingSkeleton />}

      {status === "error" && (
        <div className="glass-card space-y-3 p-5 text-center">
          <p className="text-sm text-red-500">{errorMessage}</p>
          <button
            onClick={() => setStatus("idle")}
            className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
          >
            Try again
          </button>
        </div>
      )}

      {status !== "analyzing" && !analysis && status !== "error" && (
        <>
          {(mode === "photo" || mode === "upload") && (
            <PhotoCapture useCameraCapture={mode === "photo"} onAnalyze={handlePhotoAnalyze} />
          )}
          {mode === "manual" && (
            <ManualEntry onAnalyze={(desc) => handleTextAnalyze(desc, "manual")} />
          )}
          {mode === "voice" && (
            <VoiceCapture onAnalyze={(transcript) => handleTextAnalyze(transcript, "voice")} />
          )}
        </>
      )}

      {analysis && status !== "analyzing" && status !== "error" && (
        <MealReview
          analysis={analysis}
          mealType={mealType}
          onMealTypeChange={setMealType}
          onClarify={handleClarify}
          onSave={handleSave}
          refining={status === "refining"}
          saving={status === "saving"}
        />
      )}
    </div>
  );
}

function AnalyzingSkeleton() {
  return (
    <div className="space-y-3 py-6">
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-12 w-full" />
      <div className="skeleton h-12 w-3/4" />
      <p className="pt-2 text-center text-sm text-black/50 dark:text-white/50">
        Analyzing your meal…
      </p>
    </div>
  );
}
