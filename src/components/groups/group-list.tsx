"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, Plus, UsersRound } from "lucide-react";
import { useSavedGroups } from "@/components/groups/use-saved-groups";
import { useAuth } from "@/components/groups/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const avatarColors = ["bg-[#e7f0e8] text-[#315d45]", "bg-[#f9ebe6] text-[#9c5b47]", "bg-[#edf0f7] text-[#526184]", "bg-[#f6f0df] text-[#816d31]"];

export function GroupList({ createHref = "/groups" }: { createHref?: string }) {
  const { groups, loading, storageError, hasLocalGroups, importLocalGroups } = useSavedGroups();
  const { user } = useAuth();

  return <section aria-labelledby="groups-heading">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#87928b]">YOUR PEOPLE</p>
        <h2 id="groups-heading" className="mt-1 text-xl font-semibold tracking-[-0.035em]">Your groups</h2>
      </div>
      <Link href={createHref} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-[#eaf1ec]"><Plus size={16} aria-hidden="true" /><span className="hidden sm:inline">New group</span><span className="sm:hidden">Create</span></Link>
    </div>

    {storageError && <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-[#f0d3cd] bg-danger-soft p-3 text-sm text-danger"><CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{storageError}</p>}

    {user && hasLocalGroups && <div className="mb-4 flex flex-col items-start gap-3 rounded-xl border border-[#eadbb7] bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-5 text-[#75511e]">Browser-saved groups are ready to import. Your local copy stays as a backup.</p><Button type="button" variant="outline" size="sm" onClick={() => void importLocalGroups()} className="border-[#e2d4b2] bg-white">Import groups</Button></div>}

    {loading ? <div role="status" aria-label="Loading groups" className="grid gap-3 sm:grid-cols-2"><Card className="h-[128px] animate-pulse bg-[#f0f3ef]" /><Card className="hidden h-[128px] animate-pulse bg-[#f0f3ef] sm:block" /></div>
      : groups.length === 0 ? <Card className="border-dashed bg-white px-5 py-8 text-center sm:py-10">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#eaf1ec] text-primary"><UsersRound size={20} aria-hidden="true" /></span>
        <h3 className="mt-4 text-base font-semibold">Start with your people</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">Create a group for a trip, a shared home, or the next dinner out.</p>
        <Link href={createHref} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">Create your first group <ArrowRight size={15} aria-hidden="true" /></Link>
      </Card> : <div className="grid gap-3 sm:grid-cols-2">
        {groups.map(({ group, members }) => <Link href={`/groups/${encodeURIComponent(group.id)}`} key={group.id} className="group rounded-2xl border border-border bg-white p-4 transition-colors hover:border-[#b7cbbd] hover:bg-[#fcfdfb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="truncate text-base font-semibold tracking-[-0.02em]">{group.name}</h3><p className="mt-1 text-sm text-muted">{members.length} {members.length === 1 ? "person" : "people"}</p></div>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted transition-colors group-hover:bg-[#eaf1ec] group-hover:text-primary"><ArrowRight size={17} aria-hidden="true" /></span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#eef1ed] pt-3">
            <div className="flex -space-x-2" aria-label={`${members.length} group members`}>
              {members.slice(0, 4).map((member, index) => <span key={member.id} title={member.name} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-white text-[10px] font-bold ${avatarColors[index % avatarColors.length]}`}>{member.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>)}
              {members.length > 4 && <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-surface-muted text-[10px] font-semibold text-muted">+{members.length - 4}</span>}
            </div>
            <Badge>{group.createdAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(group.createdAt)) : "New"}</Badge>
          </div>
        </Link>)}
      </div>}
  </section>;
}
