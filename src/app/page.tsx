import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Plus, ReceiptText, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GroupList } from "@/components/groups/group-list";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const exampleActivity = [
  { title: "Dinner at Paloma", detail: "Maya paid · 3 people", amount: "$18.50", direction: "owe" as const, initials: "M", tone: "bg-[#f8ebe6] text-[#965641]" },
  { title: "Weekly groceries", detail: "You paid · 2 people", amount: "$24.00", direction: "owed" as const, initials: "Y", tone: "bg-[#eaf1ec] text-[#315d45]" },
  { title: "Cab to the coast", detail: "Jordan paid · 4 people", amount: "$9.25", direction: "owe" as const, initials: "J", tone: "bg-[#edf0f7] text-[#526184]" },
];

export default function Home() {
  return <AppShell title="Overview" description="A clear view of the shared costs you’re keeping track of." active="overview" action={<Link href="/groups" className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover"><Plus size={15} aria-hidden="true" />New group</Link>}>
    <div className="space-y-7 sm:space-y-9">
      <section aria-labelledby="welcome-title" className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center sm:p-7">
        <div className="max-w-2xl">
          <Badge tone="green"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />SHARED EXPENSES, MADE CLEAR</Badge>
          <h2 id="welcome-title" className="mt-3 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">Good company. Clear totals.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Keep the bill fair without the awkward follow-up. Create a group, add what you shared, and see the math before anyone settles up.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/scan" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-foreground hover:bg-surface-muted"><ReceiptText size={16} aria-hidden="true" />Scan receipt</Link>
          <Link href="/groups" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-surface-muted px-4 text-sm font-semibold text-foreground hover:bg-[#e8eee9]"><UsersRound size={16} aria-hidden="true" />View groups</Link>
        </div>
      </section>

      <section aria-labelledby="example-summary-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#87928b]">AT A GLANCE</p><h2 id="example-summary-title" className="mt-1 text-lg font-semibold tracking-[-0.025em]">Example balances</h2></div><Badge tone="amber">Example data · not your totals</Badge></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="You owe" amount="$27.75" detail="Across 2 example groups" direction="owe" />
          <SummaryCard label="Owed to you" amount="$24.00" detail="Across 1 example group" direction="owed" />
          <Card className="p-4 sm:p-5"><p className="text-sm font-medium text-muted">Example shared spend</p><p className="mt-2 text-2xl font-semibold tracking-[-0.045em]">$86.50</p><p className="mt-1 text-xs text-[#87928b]">Illustrative only · no live totals</p></Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#edf1ed] px-5 py-4 sm:px-6"><div><h2 className="text-base font-semibold">Recent activity</h2><p className="mt-0.5 text-xs text-muted">A sample of how shared expenses appear</p></div><Badge>Example</Badge></div>
          <ul className="divide-y divide-[#edf1ed]">
            {exampleActivity.map((entry) => <li key={entry.title} className="flex items-center gap-3 px-5 py-4 sm:px-6">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${entry.tone}`}>{entry.initials}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.title}</p><p className="mt-0.5 text-xs text-muted">{entry.detail}</p></div>
              <div className="text-right"><p className={`text-sm font-semibold ${entry.direction === "owed" ? "text-success" : "text-foreground"}`}>{entry.direction === "owed" ? "+" : "−"}{entry.amount}</p><p className="mt-0.5 text-[11px] text-muted">{entry.direction === "owed" ? "your share back" : "your share"}</p></div>
            </li>)}
          </ul>
          <div className="flex items-start gap-2 border-t border-[#edf1ed] bg-[#fbfcfa] px-5 py-3 text-xs leading-5 text-muted sm:px-6"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c79d50]" />Example entries are illustrative. Your real balances appear inside each group’s settlement.</div>
        </Card>
        <Card className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#87928b]">GET STARTED</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.025em]">Keep everyone on the same page.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Groups keep people, item splits, and settlement details together.</p>
          <div className="mt-5 space-y-3">
            <Step number="1" title="Create a group" detail="Add the people sharing the cost." />
            <Step number="2" title="Add an expense" detail="Scan a receipt or enter items by hand." />
            <Step number="3" title="Review the split" detail="Check item shares, tax, and tip." />
          </div>
          <Link href="/groups" className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">Create your first group <ArrowRight size={16} aria-hidden="true" /></Link>
        </Card>
      </section>

      <section aria-label="Your real groups"><GroupList /></section>
    </div>
  </AppShell>;
}

function SummaryCard({ label, amount, detail, direction }: { label: string; amount: string; detail: string; direction: "owe" | "owed" }) {
  const Icon = direction === "owe" ? ArrowUpRight : ArrowDownLeft;
  return <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${direction === "owed" ? "bg-success-soft text-success" : "bg-surface-muted text-muted"}`}><Icon size={16} aria-hidden="true" /></span></div><p className="mt-2 text-2xl font-semibold tracking-[-0.045em]">{amount}</p><p className="mt-1 text-xs text-[#87928b]">{detail}</p></Card>;
}

function Step({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div className="flex items-start gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf1ec] text-xs font-semibold text-primary">{number}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-muted">{detail}</p></div></div>;
}
