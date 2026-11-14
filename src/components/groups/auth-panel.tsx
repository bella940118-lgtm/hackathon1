"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, CircleUserRound, Mail } from "lucide-react";
import { useAuth } from "@/components/groups/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthPanel() {
  const { user, loading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await signIn(email.trim());
      setMessage("Check your inbox for your sign-in link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We couldn’t send the sign-in link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <span role="status" className="text-xs font-medium text-muted">Checking sign-in…</span>;

  if (user) return <div className="flex min-w-0 items-center gap-2.5">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eaf1ec] text-primary"><CircleUserRound size={17} aria-hidden="true" /></span>
    <span className="hidden max-w-40 truncate text-xs font-medium text-muted sm:inline">{user.email}</span>
    <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>Sign out</Button>
  </div>;

  return <div className="w-full sm:w-auto">
    <form onSubmit={submit} className="flex w-full items-center gap-2 sm:w-auto">
      <label className="sr-only" htmlFor="auth-email">Email for cloud sync</label>
      <div className="relative min-w-0 flex-1 sm:w-[210px] sm:flex-none">
        <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#88958d]" aria-hidden="true" />
        <Input id="auth-email" name="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email for cloud sync" className="h-10 pl-9 text-xs" />
      </div>
      <Button type="submit" size="sm" disabled={busy} className="h-10 shrink-0 px-3">{busy ? "Sending…" : <>Sign in <ArrowRight size={14} aria-hidden="true" /></>}</Button>
    </form>
    {message && <p role="status" className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">{message.startsWith("Check") && <CheckCircle2 size={13} className="text-success" aria-hidden="true" />}{message}</p>}
  </div>;
}
