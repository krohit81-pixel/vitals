"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateWeightLogAction, deleteWeightLogAction } from "../actions";

export default function WeightEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    supabase
      .from("weight_logs")
      .select("weight, unit, measured_at, notes")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setWeight(String(data.weight));
          setUnit(data.unit);
          const d = new Date(data.measured_at);
          setDateValue(d.toISOString().slice(0, 10));
          setTimeValue(d.toTimeString().slice(0, 5));
          setNotes(data.notes ?? "");
        }
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const measuredAtIso = new Date(`${dateValue}T${timeValue}`).toISOString();
    await updateWeightLogAction(id, Number(weight), unit, measuredAtIso, notes);
    router.push("/weight");
  };

  if (loading) {
    return <div className="skeleton h-64 w-full" />;
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/weight")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Edit weight</h1>
        </div>
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => deleteWeightLogAction(id)}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white"
            >
              Confirm
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="text-sm text-black/50 dark:text-white/50">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="flex items-center gap-1.5 text-sm font-medium text-red-500">
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>

      <div className="glass-card-solid space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 text-xl font-semibold"
          />
          <div className="flex gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
            {(["kg", "lb"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${unit === u ? "bg-white shadow-soft dark:bg-graphite-50" : "text-black/50 dark:text-white/50"}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} />
          <Input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} />
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full resize-none rounded-xl border border-black/[0.08] bg-white/70 p-3 text-sm outline-none focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04]"
        />

        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
