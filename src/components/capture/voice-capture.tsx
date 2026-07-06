"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Minimal ambient typing for the Web Speech API — not yet in TS's DOM lib.
interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike; length: number }; length: number };
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

export function VoiceCapture({ onAnalyze }: { onAnalyze: (transcript: string) => void }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i]?.[0]?.transcript ?? "";
      }
      setTranscript(combined);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setListening(true);
    }
  };

  if (!supported) {
    return (
      <p className="py-10 text-center text-sm text-black/50 dark:text-white/50">
        Voice entry isn&apos;t supported in this browser. Try Chrome or Safari, or use manual entry instead.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-8">
      <button
        onClick={toggle}
        className={cn(
          "pressable flex h-24 w-24 items-center justify-center rounded-full text-white shadow-glow transition-colors",
          listening ? "bg-red-500" : "bg-gradient-to-br from-emerald-400 to-emerald-600"
        )}
      >
        {listening ? <Square size={26} /> : <Mic size={30} />}
      </button>
      <p className="text-sm text-black/50 dark:text-white/50">
        {listening ? "Listening… tap to stop" : "Tap to speak, e.g. \"Two boiled eggs and a coffee\""}
      </p>

      {transcript && (
        <div className="w-full max-w-sm space-y-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-black/[0.08] bg-white/70 p-3 text-sm outline-none focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04]"
          />
          <Button size="lg" className="w-full" onClick={() => onAnalyze(transcript.trim())}>
            Analyze meal
          </Button>
        </div>
      )}
    </div>
  );
}
