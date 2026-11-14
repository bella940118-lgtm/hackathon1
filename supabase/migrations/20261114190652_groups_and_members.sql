-- User-owned groups and members. Run after reviewing existing public schema objects.
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists groups_owner_id_idx on public.groups(owner_id);
create index if not exists group_members_group_id_idx on public.group_members(group_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_members from anon, authenticated;
grant select, insert, update, delete on table public.groups to authenticated;
grant select, insert, update, delete on table public.group_members to authenticated;

drop policy if exists "Owners can read groups" on public.groups;
create policy "Owners can read groups" on public.groups for select to authenticated
  using ((select auth.uid()) = owner_id);
drop policy if exists "Owners can create groups" on public.groups;
create policy "Owners can create groups" on public.groups for insert to authenticated
  with check ((select auth.uid()) = owner_id);
drop policy if exists "Owners can update groups" on public.groups;
create policy "Owners can update groups" on public.groups for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
drop policy if exists "Owners can delete groups" on public.groups;
create policy "Owners can delete groups" on public.groups for delete to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can read group members" on public.group_members;
create policy "Owners can read group members" on public.group_members for select to authenticated
  using (exists (select 1 from public.groups g where g.id = public.group_members.group_id and g.owner_id = (select auth.uid())));
drop policy if exists "Owners can create group members" on public.group_members;
create policy "Owners can create group members" on public.group_members for insert to authenticated
  with check (exists (select 1 from public.groups g where g.id = public.group_members.group_id and g.owner_id = (select auth.uid())));
drop policy if exists "Owners can update group members" on public.group_members;
create policy "Owners can update group members" on public.group_members for update to authenticated
  using (exists (select 1 from public.groups g where g.id = public.group_members.group_id and g.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.groups g where g.id = public.group_members.group_id and g.owner_id = (select auth.uid())));
drop policy if exists "Owners can delete group members" on public.group_members;
create policy "Owners can delete group members" on public.group_members for delete to authenticated
  using (exists (select 1 from public.groups g where g.id = public.group_members.group_id and g.owner_id = (select auth.uid())));
