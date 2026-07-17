"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createShortcutAction, updateShortcutAction, deleteShortcutAction } from "@/app/(app)/profile/meal-shortcuts/actions";

const MAX_LENGTH = 50;

export interface ShortcutRow {
  id: string;
  label: string;
}

export function ShortcutManager({ initialShortcuts }: { initialShortcuts: ShortcutRow[] }) {
  const [shortcuts, setShortcuts] = useState(initialShortcuts);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    setError(null);
    startTransition(async () => {
      try {
        await createShortcutAction(label);
        setShortcuts((prev) => [...prev, { id: crypto.randomUUID(), label }]);
        setNewLabel("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't add that.");
      }
    });
  };

  const startEdit = (row: ShortcutRow) => {
    setEditingId(row.id);
    setEditValue(row.label);
    setError(null);
  };

  const handleSaveEdit = (id: string) => {
    const label = editValue.trim();
    if (!label) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateShortcutAction(id, label);
        setShortcuts((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));
        setEditingId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save that.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteShortcutAction(id);
      setShortcuts((prev) => prev.filter((s) => s.id !== id));
      setConfirmingDeleteId(null);
    });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <textarea
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="e.g. Grilled chicken with brown rice"
              rows={2}
              maxLength={MAX_LENGTH}
              className="w-full resize-none rounded-xl border border-black/[0.08] bg-white/70 p-3 text-sm outline-none placeholder:text-black/35 focus:border-emerald-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:placeholder:text-white/35"
            />
            <p className="mt-1 text-right text-[11px] text-black/35 dark:text-white/35">
              {newLabel.length}/{MAX_LENGTH}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={pending || !newLabel.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white disabled:opacity-40"
          >
            <Plus size={18} />
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </Card>

      <div className="space-y-2">
        {shortcuts.length === 0 ? (
          <p className="py-6 text-center text-sm text-black/40 dark:text-white/40">
            No shortcuts yet — add your first one above.
          </p>
        ) : (
          shortcuts.map((row) => (
            <Card key={row.id} className="p-3">
              {editingId === row.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.slice(0, MAX_LENGTH))}
                    rows={2}
                    maxLength={MAX_LENGTH}
                    autoFocus
                    className="w-full resize-none rounded-xl border border-emerald-500 bg-white/70 p-3 text-sm outline-none dark:bg-white/[0.04]"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-black/35 dark:text-white/35">
                      {editValue.length}/{MAX_LENGTH}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
                      >
                        <X size={15} />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(row.id)}
                        disabled={pending || !editValue.trim()}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white disabled:opacity-40"
                      >
                        <Check size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <p className="flex-1 whitespace-normal break-words text-sm leading-snug text-ink dark:text-cream-100">
                    {row.label}
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => startEdit(row)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 hover:bg-black/5 dark:text-white/40 dark:hover:bg-white/10"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmingDeleteId === row.id ? (
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={pending}
                        className="flex h-8 items-center rounded-full bg-red-500 px-2.5 text-xs font-medium text-white"
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmingDeleteId(row.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
