import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Home, ScanLine, UsersRound } from "lucide-react";
import { AuthPanel } from "@/components/groups/auth-panel";
import { SplitzyMark } from "@/components/splitzy-mark";
import { cn } from "@/lib/utils";

type Destination = "overview" | "groups" | "scan";

const navigation: Array<{ href: string; label: string; key: Destination; Icon: typeof Home }> = [
  { href: "/", label: "Overview", key: "overview", Icon: Home },
  { href: "/groups", label: "Groups", key: "groups", Icon: UsersRound },
  { href: "/scan", label: "Scan receipt", key: "scan", Icon: ScanLine },
];

export function AppShell({ title, description, active, children, action }: { title: string; description?: string; active: Destination; children: ReactNode; action?: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto flex min-h-screen max-w-[1600px]">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-[#fbfcfa] px-5 py-6 lg:flex">
        <Link href="/" aria-label="Splitzy overview" className="flex items-center gap-3 px-2">
          <SplitzyMark />
          <span className="text-[1.2rem] font-bold tracking-[-0.055em]">splitzy</span>
        </Link>
        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a968e]">Your space</p>
        <nav aria-label="Main navigation" className="space-y-1">
          {navigation.map(({ href, label, key, Icon }) => <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors", active === key ? "bg-[#eaf1ec] text-primary" : "text-muted hover:bg-surface-muted hover:text-foreground")}><Icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>{key === "scan" && <ArrowUpRight size={14} className="ml-auto text-[#9aa69e]" aria-hidden="true" />}</Link>)}
        </nav>
        <div className="mt-auto rounded-2xl border border-border bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf4ee] text-primary"><UsersRound size={17} aria-hidden="true" /></div>
          <p className="mt-3 text-sm font-semibold">Better together</p>
          <p className="mt-1 text-xs leading-5 text-muted">Keep shared costs clear, so the good parts stay the focus.</p>
          <Link href="/groups" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View your groups <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </div>
        <div className="mt-5 border-t border-border pt-4 px-2 text-[11px] text-[#8a968e]">Splitzy · Scan. Split. Settle.</div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-background/95 px-4 py-4 sm:px-7 sm:py-5 lg:px-10">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" aria-label="Splitzy overview" className="lg:hidden"><SplitzyMark /></Link>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-[-0.035em] sm:text-[1.35rem]">{title}</h1>
                {description && <p className="mt-0.5 hidden text-sm text-muted sm:block">{description}</p>}
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
              {action}
              <AuthPanel />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-[calc(104px+env(safe-area-inset-bottom))] pt-6 sm:px-7 sm:pt-8 lg:px-10 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-white/95 px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(24,37,31,0.04)] backdrop-blur lg:hidden">
      {navigation.map(({ href, label, key, Icon }) => <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold", active === key ? "text-primary" : "text-muted")}><Icon size={19} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>)}
    </nav>
  </div>;
}
