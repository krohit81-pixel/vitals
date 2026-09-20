"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateBloodPressureAction, deleteBloodPressureAction } from "../actions";

export default function BloodPressureEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    supabase
      .from("blood_pressure_logs")
      .select("systolic, diastolic, measured_at, notes")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setSystolic(String(data.systolic));
          setDiastolic(String(data.diastolic));
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
    await updateBloodPressureAction(id, Number(systolic), Number(diastolic), measuredAtIso, notes);
    router.push("/blood-pressure");
  };

  if (loading) {
    return <div className="skeleton h-64 w-full" />;
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/blood-pressure")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-cream-100">Edit reading</h1>
        </div>
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => deleteBloodPressureAction(id)}
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Systolic (high)</label>
            <Input
              type="number"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              className="text-lg font-semibold tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Diastolic (low)</label>
            <Input
              type="number"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              className="text-lg font-semibold tabular-nums"
            />
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
