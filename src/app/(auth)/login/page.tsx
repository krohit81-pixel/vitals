"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { signInAction, type AuthFormState } from "../actions";

const initialState: AuthFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-6 dark:bg-graphite">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size="lg" />
          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-black/50 dark:text-white/50">Log in to keep your streak going.</p>
        </div>

        <form action={formAction} className="glass-card-solid space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Email</label>
            <Input name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Password</label>
            <Input name="password" type="password" required placeholder="••••••••" />
          </div>

          {state.error && <p className="text-sm text-red-500">{state.error}</p>}

          <SubmitButton />
        </form>

        <p className="mt-6 text-center text-sm text-black/50 dark:text-white/50">
          New here?{" "}
          <Link href="/signup" className="font-medium text-emerald-600 dark:text-emerald-400">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
