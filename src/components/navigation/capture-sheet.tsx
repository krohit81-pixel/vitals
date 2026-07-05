"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, PenLine, Mic, Barcode, X } from "lucide-react";

const ACTIONS = [
  { icon: Camera, label: "Take Photo", enabled: true },
  { icon: ImagePlus, label: "Upload Photo", enabled: true },
  { icon: PenLine, label: "Manual Entry", enabled: true },
  { icon: Mic, label: "Voice Entry", enabled: true },
  { icon: Barcode, label: "Barcode Scan", enabled: false },
] as const;

export function CaptureSheet({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (label: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-black/[0.06] bg-white/95 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] backdrop-blur-lg dark:border-white/[0.06] dark:bg-graphite-50/95 md:inset-x-auto md:bottom-8 md:left-1/2 md:w-96 md:-translate-x-1/2 md:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-medium">Log a meal</h2>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ACTIONS.map(({ icon: Icon, label, enabled }) => (
                <button
                  key={label}
                  disabled={!enabled}
                  onClick={() => enabled && onSelect(label)}
                  className="pressable flex flex-col items-center gap-2 rounded-xl border border-black/[0.05] bg-cream-100/60 py-5 text-sm font-medium disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <Icon size={22} className="text-emerald-600 dark:text-emerald-400" />
                  {label}
                  {!enabled && <span className="text-[10px] font-normal text-black/40 dark:text-white/40">Coming soon</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
