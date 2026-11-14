import Link from "next/link";
import { ArrowDown, Plus, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GroupForm } from "@/components/groups/group-form";
import { GroupList } from "@/components/groups/group-list";

export default function GroupsPage() {
  return <AppShell title="Groups" description="Keep people and shared expenses in one place." active="groups" action={<Link href="#create-group" className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover"><Plus size={15} aria-hidden="true" />Create group</Link>}>
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:gap-10">
      <div className="scroll-mt-8" id="create-group"><GroupForm /></div>
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 sm:p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf1ec] text-primary"><UsersRound size={18} aria-hidden="true" /></span>
          <div><h2 className="text-sm font-semibold">One space per shared plan</h2><p className="mt-1 text-sm leading-5 text-muted">Add people once, then keep item splits and balances organized inside each group.</p></div>
        </div>
        <GroupList createHref="#create-group" />
        <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted"><ArrowDown size={14} className="mt-0.5 shrink-0" aria-hidden="true" />Group totals are calculated from the expenses you add. No example balances are mixed with your data.</p>
      </div>
    </div>
  </AppShell>;
}
