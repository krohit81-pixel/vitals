"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, PenLine, Mic, Barcode, Droplets, Dumbbell, Scale, X, ArrowLeft, Check } from "lucide-react";
import { logWaterAction } from "@/lib/nutrition/water-actions";
import { logWeightAction } from "@/app/(app)/weight/actions";
import { localTodayString } from "@/lib/nutrition/date";

const ACTIONS = [
  { icon: Camera, label: "Take Photo", enabled: true },
  { icon: ImagePlus, label: "Upload Photo", enabled: true },
  { icon: PenLine, label: "Manual Entry", enabled: true },
  { icon: Mic, label: "Voice Entry", enabled: true },
  { icon: Droplets, label: "Add Water", enabled: true },
  { icon: Dumbbell, label: "Log Workout", enabled: true },
  { icon: Scale, label: "Log Weight", enabled: true },
  { icon: Barcode, label: "Barcode Scan", enabled: false },
] as const;

const WATER_PRESETS_ML = [250, 500, 750];

export function CaptureSheet({
  open,
  onClose,
  onSelect,
  previousWeight,
  weightUnit,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (label: string) => void;
  previousWeight: number | null;
  weightUnit: "kg" | "lb";
}) {
  const [view, setView] = useState<"menu" | "water" | "weight">("menu");
  const [customMl, setCustomMl] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [unit, setUnit] = useState<"kg" | "lb">(weightUnit);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setView("menu");
    setCustomMl("");
    setWeightValue("");
    setSaved(false);
  };

  const handleClose = () => {
    onClose();
    // Wait for the close animation before resetting, so it doesn't flash back to the menu mid-exit.
    setTimeout(reset, 200);
  };

  const addWater = (ml: number) => {
    startTransition(async () => {
      await logWaterAction(ml, localTodayString());
      setSaved(true);
      setTimeout(handleClose, 700);
    });
  };

  const saveWeight = () => {
    const value = Number(weightValue);
    if (!value) return;
    startTransition(async () => {
      await logWeightAction(value, unit, new Date().toISOString());
      setSaved(true);
      setTimeout(handleClose, 900);
    });
  };

  const handleMenuSelect = (label: string) => {
    if (label === "Add Water") {
      setView("water");
      return;
    }
    if (label === "Log Weight") {
      setView("weight");
      return;
    }
    onSelect(label);
  };

  const diff = previousWeight !== null && weightValue ? Number(weightValue) - previousWeight : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-black/[0.06] bg-white/95 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] backdrop-blur-lg dark:border-white/[0.06] dark:bg-graphite-50/95 md:inset-x-auto md:bottom-8 md:left-1/2 md:w-96 md:-translate-x-1/2 md:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            {view === "menu" && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-base font-medium">Log a meal</h2>
                  <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {ACTIONS.map(({ icon: Icon, label, enabled }) => (
                    <button
                      key={label}
                      disabled={!enabled}
                      onClick={() => enabled && handleMenuSelect(label)}
                      className="pressable flex flex-col items-center gap-2 rounded-xl border border-black/[0.05] bg-cream-100/60 py-5 text-sm font-medium disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03]"
                    >
                      <Icon size={22} className="text-emerald-600 dark:text-emerald-400" />
                      {label}
                      {!enabled && <span className="text-[10px] font-normal text-black/40 dark:text-white/40">Coming soon</span>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === "water" && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <button onClick={() => setView("menu")} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="font-display text-base font-medium">Add water</h2>
                  <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                    <X size={18} />
                  </button>
                </div>

                {saved ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-emerald-600 dark:text-emerald-400">
                    <Check size={28} />
                    <p className="text-sm font-medium">Logged</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {WATER_PRESETS_ML.map((ml) => (
                        <button
                          key={ml}
                          disabled={pending}
                          onClick={() => addWater(ml)}
                          className="pressable flex flex-col items-center gap-1 rounded-xl border border-black/[0.05] bg-cream-100/60 py-4 text-sm font-medium disabled:opacity-40 dark:border-white/[0.06] dark:bg-white/[0.03]"
                        >
                          <Droplets size={18} className="text-sky-500" />
                          {ml} ml
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        placeholder="Custom amount (ml)"
                        value={customMl}
                        onChange={(e) => setCustomMl(e.target.value)}
                        className="h-11 flex-1 rounded-xl border border-black/[0.08] bg-white/70 px-3 text-sm outline-none focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04]"
                      />
                      <button
                        disabled={pending || !customMl}
                        onClick={() => addWater(Number(customMl))}
                        className="rounded-xl bg-emerald-500 px-4 text-sm font-medium text-white disabled:opacity-40"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {view === "weight" && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <button onClick={() => setView("menu")} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="font-display text-base font-medium">Log weight</h2>
                  <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                    <X size={18} />
                  </button>
                </div>

                {saved ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-emerald-600 dark:text-emerald-400">
                    <Check size={28} />
                    <p className="text-sm font-medium">
                      {weightValue} {unit} logged
                      {diff !== null && (
                        <span className="ml-1 text-black/50 dark:text-white/50">
                          ({diff >= 0 ? "↑" : "↓"} {Math.abs(diff).toFixed(1)} {unit} since last)
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="Weight"
                        value={weightValue}
                        onChange={(e) => setWeightValue(e.target.value)}
                        autoFocus
                        className="h-14 flex-1 rounded-xl border border-black/[0.08] bg-white/70 px-4 text-2xl font-semibold tabular-nums outline-none focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04]"
                      />
                      <div className="flex gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
                        {(["kg", "lb"] as const).map((u) => (
                          <button
                            key={u}
                            onClick={() => setUnit(u)}
                            className={`rounded-lg px-3 py-2 text-sm font-medium ${
                              unit === u ? "bg-white shadow-soft dark:bg-graphite-50" : "text-black/50 dark:text-white/50"
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>

                    {previousWeight !== null && (
                      <p className="text-xs text-black/40 dark:text-white/40">
                        Previous: {previousWeight} {unit}
                        {diff !== null && (
                          <span className="ml-1">
                            ({diff >= 0 ? "↑" : "↓"} {Math.abs(diff).toFixed(1)} {unit})
                          </span>
                        )}
                      </p>
                    )}

                    <button
                      disabled={pending || !weightValue}
                      onClick={saveWeight}
                      className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white disabled:opacity-40"
                    >
                      {pending ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
