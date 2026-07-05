"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Leaf } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUpAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signUpAction, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-6 dark:bg-graphite">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-glow">
            <Leaf size={24} />
          </div>
          <h1 className="font-display text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-black/50 dark:text-white/50">Effortless food logging starts here.</p>
        </div>

        <form action={formAction} className="glass-card-solid space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Name</label>
            <Input name="fullName" required placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Email</label>
            <Input name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Password</label>
            <Input name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
