-- Add itemized, owner-scoped expense persistence for Splitzy.
-- Amounts are stored as integer cents; tax and tip are allocated by the app.

-- Required as a composite target so every member reference is constrained to
-- the same group as its expense. group_members.id remains its primary key.
create unique index if not exists groups_id_expense_fk_uidx
  on public.groups (id);
create unique index if not exists group_members_id_group_id_uidx
  on public.group_members (id, group_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  paid_by_member_id uuid not null,
  description text not null check (char_length(trim(description)) between 1 and 80),
  tax_cents bigint not null default 0 check (tax_cents >= 0),
  tip_cents bigint not null default 0 check (tip_cents >= 0),
  created_at timestamptz not null default now(),
  constraint expenses_payer_same_group_fk
    foreign key (paid_by_member_id, group_id)
    references public.group_members (id, group_id) on delete restrict,
  constraint expenses_id_group_id_key unique (id, group_id)
);

create table if not exists public.expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null,
  group_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  quantity integer not null check (quantity between 1 and 999),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint expense_items_expense_same_group_fk
    foreign key (expense_id, group_id)
    references public.expenses (id, group_id) on delete cascade,
  constraint expense_items_id_group_id_key unique (id, group_id)
);

create table if not exists public.item_splits (
  expense_item_id uuid not null,
  group_id uuid not null,
  member_id uuid not null,
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  constraint item_splits_pkey primary key (expense_item_id, member_id),
  constraint item_splits_item_same_group_fk
    foreign key (expense_item_id, group_id)
    references public.expense_items (id, group_id) on delete cascade,
  constraint item_splits_member_same_group_fk
    foreign key (member_id, group_id)
    references public.group_members (id, group_id) on delete restrict
);

create index if not exists expenses_group_id_created_at_idx
  on public.expenses (group_id, created_at desc);
create index if not exists expenses_paid_by_member_id_idx
  on public.expenses (paid_by_member_id);
create index if not exists expense_items_expense_id_sort_order_idx
  on public.expense_items (expense_id, sort_order);
create index if not exists item_splits_group_id_member_id_idx
  on public.item_splits (group_id, member_id);

alter table public.expenses enable row level security;
alter table public.expense_items enable row level security;
alter table public.item_splits enable row level security;

revoke all on table public.expenses from anon, authenticated;
revoke all on table public.expense_items from anon, authenticated;
revoke all on table public.item_splits from anon, authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.expense_items to authenticated;
grant select, insert, update, delete on table public.item_splits to authenticated;

drop policy if exists "Group owners can read expenses" on public.expenses;
create policy "Group owners can read expenses" on public.expenses
  for select to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.expenses.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can create expenses" on public.expenses;
create policy "Group owners can create expenses" on public.expenses
  for insert to authenticated
  with check (exists (
    select 1 from public.groups g
    where g.id = public.expenses.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can update expenses" on public.expenses;
create policy "Group owners can update expenses" on public.expenses
  for update to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.expenses.group_id and g.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.groups g
    where g.id = public.expenses.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can delete expenses" on public.expenses;
create policy "Group owners can delete expenses" on public.expenses
  for delete to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.expenses.group_id and g.owner_id = (select auth.uid())
  ));

drop policy if exists "Group owners can read expense items" on public.expense_items;
create policy "Group owners can read expense items" on public.expense_items
  for select to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.expense_items.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can create expense items" on public.expense_items;
create policy "Group owners can create expense items" on public.expense_items
  for insert to authenticated
  with check (exists (
    select 1 from public.groups g
    where g.id = public.expense_items.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can update expense items" on public.expense_items;
create policy "Group owners can update expense items" on public.expense_items
  for update to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.expense_items.group_id and g.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.groups g
    where g.id = public.expense_items.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can delete expense items" on public.expense_items;
create policy "Group owners can delete expense items" on public.expense_items
  for delete to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.expense_items.group_id and g.owner_id = (select auth.uid())
  ));

drop policy if exists "Group owners can read item splits" on public.item_splits;
create policy "Group owners can read item splits" on public.item_splits
  for select to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.item_splits.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can create item splits" on public.item_splits;
create policy "Group owners can create item splits" on public.item_splits
  for insert to authenticated
  with check (exists (
    select 1 from public.groups g
    where g.id = public.item_splits.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can update item splits" on public.item_splits;
create policy "Group owners can update item splits" on public.item_splits
  for update to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.item_splits.group_id and g.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.groups g
    where g.id = public.item_splits.group_id and g.owner_id = (select auth.uid())
  ));
drop policy if exists "Group owners can delete item splits" on public.item_splits;
create policy "Group owners can delete item splits" on public.item_splits
  for delete to authenticated
  using (exists (
    select 1 from public.groups g
    where g.id = public.item_splits.group_id and g.owner_id = (select auth.uid())
  ));
