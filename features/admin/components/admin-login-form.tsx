"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/app/admin/login/actions";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLogin, null);

  return (
    <form
      action={formAction}
      className="w-full max-w-[420px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-soft)] p-10"
    >
      <h1 className="font-serif text-[28px] tracking-[-0.02em] text-[var(--color-ink)]">
        Alvari admin
      </h1>
      <p className="mb-8 mt-1 text-sm font-light text-[var(--color-muted)]">
        Sign in to manage products, blogs and enquiries.
      </p>

      <div className="mb-4">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className="mb-6">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-[var(--color-ink)] px-8 py-4 text-sm uppercase tracking-[0.08em] text-[var(--color-bg)] transition-all duration-300 hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>

      {state?.error && (
        <p className="mt-3 text-center text-xs text-red-700">{state.error}</p>
      )}
    </form>
  );
}
